import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { apiService } from '@/services/api/apiService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { useAppSelector } from '@/store/hooks';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';
import { resolveMediaUrl } from '@/utils/resolveMediaUrl';
import type { Order, OrderItem, OrderListParams, CreateOrderRequest } from '@/types/order';

function useOrderEndpoints() {
  const role = useAppSelector((s) => s.auth.user?.role);
  return role === 'customer' ? API_ENDPOINTS.ORDERS.CUSTOMER : API_ENDPOINTS.ORDERS.DEALER;
}

type ApiOrderItem = {
  id?: string;
  variant_id?: string | number;
  product_name?: string;
  variant_name?: string;
  display_name?: string;
  image?: string | null;
  image_url?: string | null;
  variant_image?: string | null;
  default_variant_image?: string | null;
  product_image?: string | null;
  variant?: {
    image?: string | null;
    image_url?: string | null;
    default_image?: string | null;
    images?: unknown;
  } | null;
  product?: {
    image?: string | null;
    image_url?: string | null;
    images?: unknown;
  } | null;
  images?: unknown;
  sku_code?: string;
  qty?: number;
  quantity?: number;
  unit_price?: number;
  line_total?: number;
  total?: number;
};

const firstImageFromUnknown = (input: unknown): string | null => {
  if (!Array.isArray(input)) return null;
  for (const it of input) {
    if (typeof it === 'string' && it.trim()) return it.trim();
    if (it && typeof it === 'object') {
      const maybe = (it as { url?: unknown; image?: unknown; image_url?: unknown });
      if (typeof maybe.url === 'string' && maybe.url.trim()) return maybe.url.trim();
      if (typeof maybe.image === 'string' && maybe.image.trim()) return maybe.image.trim();
      if (typeof maybe.image_url === 'string' && maybe.image_url.trim()) return maybe.image_url.trim();
    }
  }
  return null;
};

type ApiOrder = {
  id: string;
  order_number?: string;
  status?: string;
  payment_status?: string;
  payment_method?: string;
  payment_method_name?: string;
  subtotal?: number;
  discount_amount?: number;
  gst_amount?: number;
  total_amount?: number;
  placed_at?: string;
  created_at?: string;
  delivered_at?: string | null;
  return_window_days?: number;
  address?: string;
  delivery_address_line?: string;
  delivery_city?: string;
  notes?: string;
  cancellation_reason?: string | null;
  refund_status?: 'not_applicable' | 'pending' | 'processed';
  refund_processed_at?: string | null;
  items?: ApiOrderItem[];
  timeline?: Order['timeline'];
};

function mapItem(api: ApiOrderItem): OrderItem {
  const variantImage =
    api.variant?.default_image ??
    api.variant?.image ??
    api.variant?.image_url ??
    firstImageFromUnknown(api.variant?.images) ??
    api.default_variant_image ??
    api.variant_image ??
    api.image_url ??
    api.product?.image ??
    api.product?.image_url ??
    firstImageFromUnknown(api.product?.images) ??
    firstImageFromUnknown(api.images) ??
    api.product_image ??
    api.image ??
    null;

  return {
    id: String(api.id ?? ''),
    productId: Number(api.variant_id ?? 0),
    variantId: Number(api.variant_id ?? 0),
    name: api.product_name ?? api.display_name ?? '',
    variant: api.variant_name ?? api.display_name ?? '',
    image: resolveMediaUrl(variantImage),
    sku: api.sku_code ?? '',
    qty: api.qty ?? api.quantity ?? 0,
    price: api.unit_price ?? 0,
    total: api.line_total ?? api.total ?? 0,
  };
}

function mapOrderStatus(raw?: string): Order['status'] {
  const s = (raw ?? 'placed').trim();
  if (s === 'return_requested' || s === 'returned') return s;
  return s as Order['status'];
}

function toOrderListApiParams(params?: OrderListParams): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  if (params.page != null) out.page = params.page;
  if (params.limit != null) out.page_size = params.limit;
  if (params.status) out.status = params.status;
  if (params.returnsOnly === true) out.returns_only = true;
  return Object.keys(out).length ? out : undefined;
}

function mapOrder(api: ApiOrder): Order {
  const deliveryAddress = [api.delivery_address_line, api.delivery_city].filter(Boolean).join(', ').trim();
  return {
    id: String(api.id),
    orderNumber: api.order_number ?? '',
    createdAt: api.created_at ?? api.placed_at ?? '',
    deliveredAt: api.delivered_at ?? null,
    returnWindowDays:
      typeof api.return_window_days === 'number'
        ? api.return_window_days
        : api.return_window_days != null
          ? Number(api.return_window_days)
          : undefined,
    items: (api.items ?? []).map(mapItem),
    subtotal: api.subtotal ?? 0,
    discount: api.discount_amount ?? 0,
    gst: api.gst_amount ?? 0,
    total: api.total_amount ?? 0,
    status: mapOrderStatus(api.status),
    paymentMethod: api.payment_method ?? api.payment_method_name ?? '',
    paymentStatus: (api.payment_status ?? 'pending') as Order['paymentStatus'],
    address: api.address ?? deliveryAddress,
    timeline: api.timeline ?? [],
    notes: api.notes,
    cancellationReason: api.cancellation_reason ?? null,
    refundStatus: api.refund_status ?? 'not_applicable',
    refundProcessedAt: api.refund_processed_at ?? null,
  };
}

export function useOrders(
  params?: OrderListParams,
  options?: { enabled?: boolean },
) {
  const endpoints = useOrderEndpoints();
  const apiParams = toOrderListApiParams(params);
  return useQuery({
    queryKey: queryKeys.orders.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await apiService.getPaginated<ApiOrder[]>(endpoints.LIST, { params: apiParams });
      return { ...res, data: (res.data ?? []).map(mapOrder) };
    },
    enabled: options?.enabled ?? true,
  });
}

export function useOrder(id: string) {
  const endpoints = useOrderEndpoints();
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: async () => {
      const res = await apiService.get<ApiOrder>(endpoints.DETAIL(id));
      return mapOrder(res);
    },
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderRequest) =>
      apiService.post<Order>(API_ENDPOINTS.ORDERS.CREATE, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      Toast.show({ type: 'success', text1: 'Order placed successfully' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to place order') });
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();
  const endpoints = useOrderEndpoints();
  return useMutation({
    mutationFn: (orderId: string) =>
      apiService.put(endpoints.CONFIRM_DELIVERY(orderId)),
    onSuccess: (_, orderId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      Toast.show({ type: 'success', text1: 'Delivery confirmed' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to confirm delivery') });
    },
  });
}

interface CancelOrderResponse {
  order?: Record<string, unknown>;
  refund?: {
    required: boolean;
    amount: number;
    eta_days: number;
    credit_note_number: string | null;
  };
}

interface CancelOrderArgs {
  orderId: string;
  reason?: string | null;
}

/** Buyer/dealer self-cancel. Allowed statuses and time window: `canBuyerCancelOrder` + backend `cancelOrderById` / `finaliseCancellation`. */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  const endpoints = useOrderEndpoints();
  return useMutation({
    mutationFn: ({ orderId, reason }: CancelOrderArgs) =>
      apiService.put<CancelOrderResponse>(endpoints.CANCEL(orderId), reason ? { reason } : undefined),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.orderId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      const refund = data?.refund;
      if (refund?.required) {
        Toast.show({
          type: 'success',
          text1: 'Order cancelled',
          text2: `Refund of ₹${refund.amount.toLocaleString('en-IN')} will be processed within ${refund.eta_days} business days.`,
        });
      } else {
        Toast.show({ type: 'success', text1: 'Order cancelled' });
      }
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to cancel order') });
    },
  });
}
