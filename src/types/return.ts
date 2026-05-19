export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'partial_approved'
  | 'rejected'
  | 'received'
  | 'completed';

export interface ReturnItem {
  /** Return line id from server (preferred React key). */
  id?: string;
  orderItemId: string;
  skuCode?: string;
  productName: string;
  variantName: string;
  requestedQty: number;
  approvedQty?: number;
  reason: string;
  /** Resolved image URL for the variant. */
  image?: string | null;
  /** Per-line status from server: pending | approved | rejected */
  lineStatus?: string;
  photos?: string[];
}

export interface Return {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  createdAt: string;
  status: ReturnStatus;
  items: ReturnItem[];
  /** From `return_reasons` join on the return request (sent on list APIs without line items). */
  returnReasonLabel?: string;
  totalRefund?: number;
  notes?: string;
  rejectionReason?: string;
  /** Admin resolution notes when present. */
  resolution?: string | null;
  reviewedAt?: string | null;
  creditNoteNumber?: string | null;
  evidenceUrls?: string[];
}

/**
 * Wire shape sent to POST /orders/:id/returns. Field names match backend's
 * Zod schema (snake_case). evidence_urls live at the top level (not per item).
 */
export interface CreateReturnItem {
  order_item_id: string;
  qty: number;
  return_reason_id: string;
}

export interface CreateReturnRequest {
  items: CreateReturnItem[];
  notes?: string;
  evidence_urls: string[];
}

export interface ReturnListResponse {
  items: Return[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
