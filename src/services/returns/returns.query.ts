import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { apiService } from '@/services/api/apiService';
import { baseService } from '@/services/api/baseService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { useAppSelector } from '@/store/hooks';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';
import { logger } from '@/lib/logger';
import { resolveMediaUrl } from '@/utils/resolveMediaUrl';
import type { Return, ReturnStatus, CreateReturnRequest, ReturnItem } from '@/types/return';

// Backend uses different status strings than the FE type. Map at the API
// boundary so the UI keeps using FE-style names.
const mapBackendStatus = (raw: string): ReturnStatus => {
  switch (raw) {
    case 'pending':
      return 'requested';
    case 'partially_approved':
      return 'partial_approved';
    case 'approved':
    case 'rejected':
    case 'received':
    case 'completed':
      return raw;
    default:
      return 'requested';
  }
};

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function mapReturnItemRow(it: Record<string, unknown>): ReturnItem {
  const orderItemId = String(it.order_item_id ?? it.orderItemId ?? '');
  const lineId = String(it.id ?? orderItemId);
  const skuCodeRaw = it.sku_code ?? it.skuCode;
  const skuCode = typeof skuCodeRaw === 'string' && skuCodeRaw.trim() ? skuCodeRaw.trim() : undefined;
  const productName = String(it.product_name ?? it.productName ?? 'Item');
  const variantName = String(it.variant_name ?? it.variantName ?? '');
  const requested = Number(it.qty_requested ?? it.requestedQty ?? 0);
  const approvedRaw = it.qty_approved ?? it.approvedQty;
  const approvedQty =
    approvedRaw === null || approvedRaw === undefined ? undefined : Number(approvedRaw);
  const reason = String(it.return_reason ?? it.reason ?? '');
  const img = it.image;
  const image =
    typeof img === 'string' && img.trim() ? resolveMediaUrl(img.trim()) : null;
  const lineStatus = typeof it.status === 'string' ? it.status : undefined;

  return {
    id: lineId,
    orderItemId,
    skuCode,
    productName,
    variantName,
    requestedQty: Number.isFinite(requested) ? requested : 0,
    approvedQty: approvedQty !== undefined && Number.isFinite(approvedQty) ? approvedQty : undefined,
    reason,
    image,
    lineStatus,
  };
}

function mapReturnItemsFromPayload(raw: unknown): ReturnItem[] {
  if (Array.isArray(raw)) return raw.map((entry) => mapReturnItemRow(asRecord(entry)));
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const nested = o.items ?? o.return_items ?? o.returnItems ?? o.lines;
    if (Array.isArray(nested)) return nested.map((entry) => mapReturnItemRow(asRecord(entry)));
  }
  return [];
}

type RawReturn = Record<string, unknown>;

export const mapReturnFromApi = (raw: unknown): Return => {
  const r = asRecord(raw);
  const id = String(r.id ?? '');
  /** Collect evidence paths/URLs from snake_case, camelCase, JSON strings, or { url } rows. */
  const extractEvidenceUrlStrings = (value: unknown): string[] => {
    if (value == null) return [];
    if (typeof value === 'string') {
      const t = value.trim();
      if (!t) return [];
      if (t.startsWith('[') || t.startsWith('{')) {
        try {
          return extractEvidenceUrlStrings(JSON.parse(t) as unknown);
        } catch {
          return [t];
        }
      }
      return [t];
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const o = value as Record<string, unknown>;
      const keys = Object.keys(o);
      if (keys.length) {
        if (keys.every((k) => /^\d+$/.test(k))) {
          return keys
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => o[k])
            .flatMap((v) => extractEvidenceUrlStrings(v));
        }
        const vals = Object.values(o);
        if (vals.length && vals.every((v) => typeof v === 'string')) {
          return vals.flatMap((v) => extractEvidenceUrlStrings(v as string));
        }
        const u = o.url ?? o.uri ?? o.path ?? o.public_url ?? o.publicUrl;
        if (typeof u === 'string' && u.trim()) return [u.trim()];
      }
      return [];
    }
    if (!Array.isArray(value)) return [];
    const out: string[] = [];
    for (const el of value) {
      if (typeof el === 'string' && el.trim()) {
        out.push(el.trim());
        continue;
      }
      if (el && typeof el === 'object' && !Array.isArray(el)) {
        const o = el as Record<string, unknown>;
        const u = o.url ?? o.uri ?? o.path ?? o.public_url ?? o.publicUrl;
        if (typeof u === 'string' && u.trim()) out.push(u.trim());
      }
    }
    return out;
  };

  const evidenceUrls = Array.from(
    new Set(
      [
        r.evidence_urls,
        r.photo_urls,
        r.evidenceUrls,
        r.photoUrls,
        r.evidence,
      ].flatMap(extractEvidenceUrlStrings),
    ),
  );

  if (__DEV__) {
    const looksNonEmptyEvidence = (v: unknown): boolean => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'string') {
        const t = v.trim();
        return t !== '' && t !== '[]' && t !== '{}';
      }
      if (typeof v === 'object') return Object.keys(v as Record<string, unknown>).length > 0;
      return false;
    };
    const hadNonEmptyRaw =
      looksNonEmptyEvidence(r.photo_urls) ||
      looksNonEmptyEvidence(r.photoUrls) ||
      looksNonEmptyEvidence(r.evidence_urls) ||
      looksNonEmptyEvidence(r.evidenceUrls) ||
      looksNonEmptyEvidence(r.evidence);
    if (evidenceUrls.length === 0 && hadNonEmptyRaw) {
      logger.warn('[ReturnEvidence][map: non-empty raw but 0 URLs after parse]', id, {
        photo_urls: r.photo_urls,
        photoUrls: r.photoUrls,
        evidence_urls: r.evidence_urls,
        evidenceUrls: r.evidenceUrls,
        evidence: r.evidence,
      });
    } else if (evidenceUrls.length > 0) {
      logger.debug('[ReturnEvidence][map]', id, { parsedEvidenceUrls: evidenceUrls });
    }
  }

  const itemsPayload = r.items ?? r.return_items ?? r.returnItems ?? r.lines;

  const returnReasonLabelRaw = r.return_reason ?? r.returnReason ?? r.reason_label;
  const returnReasonLabel =
    typeof returnReasonLabelRaw === 'string' && returnReasonLabelRaw.trim()
      ? returnReasonLabelRaw.trim()
      : undefined;

  return {
    id,
    returnNumber: String(r.returnNumber ?? r.return_number ?? id),
    orderId: String(r.orderId ?? r.order_id ?? ''),
    orderNumber: String(r.orderNumber ?? r.order_number ?? ''),
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    status: mapBackendStatus(String(r.status ?? 'pending')),
    items: mapReturnItemsFromPayload(itemsPayload),
    returnReasonLabel,
    totalRefund: (() => {
      const raw = r.totalRefund ?? r.total_refund ?? r.refund_amount;
      if (raw === undefined || raw === null || raw === '') return undefined;
      const n = Number(raw);
      if (!Number.isFinite(n) || n === 0) return undefined;
      // Credit notes in DB use negative totals; show magnitude as refund amount.
      const magnitude = Math.abs(n);
      return magnitude > 0 ? magnitude : undefined;
    })(),
    notes: typeof r.notes === 'string' ? r.notes : undefined,
    rejectionReason:
      typeof r.rejectionReason === 'string'
        ? r.rejectionReason
        : typeof r.rejection_reason === 'string'
          ? r.rejection_reason
          : undefined,
    resolution: (() => {
      const res = r.resolution;
      if (res === undefined || res === null) return undefined;
      return String(res);
    })(),
    reviewedAt:
      typeof r.reviewedAt === 'string'
        ? r.reviewedAt
        : typeof r.reviewed_at === 'string'
          ? r.reviewed_at
          : null,
    creditNoteNumber:
      typeof r.creditNoteNumber === 'string'
        ? r.creditNoteNumber
        : typeof r.credit_note_number === 'string'
          ? r.credit_note_number
          : null,
    evidenceUrls,
  };
};

const toReturnList = (payload: unknown): RawReturn[] => {
  if (Array.isArray(payload)) return payload as RawReturn[];
  if (!payload || typeof payload !== 'object') return [];
  const p = payload as { items?: unknown; data?: unknown };
  if (Array.isArray(p.items)) return p.items as RawReturn[];
  if (Array.isArray(p.data)) return p.data as RawReturn[];
  return [];
};

export function useReturns(enabled = true) {
  const role = useAppSelector((s) => s.auth.user?.role);
  const url =
    role === 'customer' ? API_ENDPOINTS.RETURNS.CUSTOMER_LIST : API_ENDPOINTS.RETURNS.DEALER_LIST;
  return useQuery({
    queryKey: queryKeys.returns.list(),
    queryFn: async () => {
      const payload = await apiService.get<unknown>(url);
      return toReturnList(payload).map(mapReturnFromApi);
    },
    enabled,
  });
}

export function useReturn(returnId: string | undefined, initialReturn?: Return) {
  const role = useAppSelector((s) => s.auth.user?.role);
  const isDealerReturnsRole = role === 'dealer_owner' || role === 'dealer_staff';
  const url = isDealerReturnsRole
    ? returnId
      ? API_ENDPOINTS.RETURNS.DEALER_DETAIL(returnId)
      : ''
    : returnId
      ? API_ENDPOINTS.RETURNS.CUSTOMER_DETAIL(returnId)
      : '';

  return useQuery({
    queryKey: queryKeys.returns.detail(returnId ?? ''),
    queryFn: async () => {
      const raw = await apiService.get<unknown>(url);
      const mapped = mapReturnFromApi(raw);
      // Detail payload sometimes omits photos; keep list/navigation snapshot if present.
      const mergedFromInitial =
        !mapped.evidenceUrls?.length && !!initialReturn?.evidenceUrls?.length;
      const finalReturn = mergedFromInitial
        ? { ...mapped, evidenceUrls: initialReturn.evidenceUrls ?? [] }
        : mapped;

      if (__DEV__) {
        const rec = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
        const rawEvidenceSnap = {
          photo_urls: rec.photo_urls,
          photoUrls: rec.photoUrls,
          evidence_urls: rec.evidence_urls,
          evidenceUrls: rec.evidenceUrls,
          evidence: rec.evidence,
        };
        logger.debug('[ReturnEvidence][detail fetch]', {
          returnId,
          requestUrl: url,
          rawEvidenceFields: rawEvidenceSnap,
          mappedEvidenceUrls: mapped.evidenceUrls,
          initialReturnEvidenceCount: initialReturn?.evidenceUrls?.length ?? 0,
          mergedFromInitial,
          finalEvidenceUrls: finalReturn.evidenceUrls,
        });
      }

      return finalReturn;
    },
    enabled: !!returnId && !!url,
    placeholderData: initialReturn,
  });
}

/**
 * Uploads up to 4 local image URIs as multipart form-data and returns the
 * server-side URLs to attach to the return request body.
 */
export function useUploadReturnEvidence() {
  return useMutation({
    mutationFn: async (uris: string[]) => {
      const form = new FormData();
      uris.forEach((uri, idx) => {
        form.append('files', { uri, type: 'image/jpeg', name: `evidence-${idx}.jpg` } as never);
      });
      const response = await baseService.post<{ data: { urls: string[] } }>(
        API_ENDPOINTS.RETURNS.UPLOAD_EVIDENCE,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response.data?.data?.urls ?? [];
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to upload evidence') });
    },
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, data }: { orderId: string; data: CreateReturnRequest }) => {
      const created = await apiService.post<unknown>(API_ENDPOINTS.RETURNS.CREATE(orderId), data);
      return mapReturnFromApi(created);
    },
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.returns.all });
      if (created?.id) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.returns.detail(created.id) });
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      Toast.show({ type: 'success', text1: 'Return request submitted' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to create return request') });
    },
  });
}
