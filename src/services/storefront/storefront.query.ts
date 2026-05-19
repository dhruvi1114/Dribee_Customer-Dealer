import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query';

import { apiService } from '@/services/api/apiService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { useAppSelector } from '@/store/hooks';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { resolveMediaUrl, resolveMediaUrls } from '@/utils/resolveMediaUrl';
import type { FulfillingWarehouseInfo, PriceSource, Product, ProductListParams, ProductVariant } from '@/types/catalogue';
import type { DeliveryContext, StorefrontLocationRequest } from '@/types/storefront';

interface StorefrontPriceApi {
  amount: number;
  source: 'warehouse' | 'base';
  gst_rate?: number | null;
  gst_amount?: number | null;
  price_with_gst?: number | null;
}

interface StorefrontFulfillingWarehouseApi {
  id: number;
  name: string;
  distance_km: number | null;
  delivery_charge: number;
  is_primary: boolean;
}

interface StorefrontProductItemApi {
  id: number;
  name: string;
  category_id: number | null;
  category_name: string | null;
  brand_id: number | null;
  brand_name: string | null;
  images: string[];
  default_variant: {
    variant_id: number;
    display_name: string;
    attribute_combination: Record<string, string> | null;
    price: StorefrontPriceApi | null;
    in_stock: boolean;
    image: string | null;
    fulfilling_warehouse: StorefrontFulfillingWarehouseApi | null;
  } | null;
}

const toPriceSource = (source: 'warehouse' | 'base' | undefined | null): PriceSource => {
  if (source === 'warehouse') return 'warehouse';
  if (source === 'base') return 'global';
  return null;
};

const normalizeImageArray = (input: unknown): string[] => {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const it of input) {
    if (typeof it === 'string' && it.trim()) {
      out.push(it.trim());
      continue;
    }
    if (it && typeof it === 'object' && 'url' in it && typeof (it as { url: unknown }).url === 'string') {
      const u = (it as { url: string }).url.trim();
      if (u) out.push(u);
    }
  }
  return out;
};

const mapFulfillingWarehouse = (
  fw: StorefrontFulfillingWarehouseApi | null | undefined,
): FulfillingWarehouseInfo | null => {
  if (!fw) return null;
  return {
    id: fw.id,
    name: fw.name,
    distanceKm: fw.distance_km,
    deliveryCharge: fw.delivery_charge,
    isPrimary: fw.is_primary,
  };
};

const mapStorefrontItem = (item: StorefrontProductItemApi): Product => {
  const raw = item as StorefrontProductItemApi & {
    defaultVariant?: StorefrontProductItemApi['default_variant'];
    default_variant_image?: string | null;
  };
  const dv = raw.default_variant ?? raw.defaultVariant ?? null;
  const amount = dv?.price?.amount ?? 0;
  const listImages = resolveMediaUrls(normalizeImageArray((item as { images?: unknown }).images));
  const thumb =
    resolveMediaUrl(dv?.image) ||
    resolveMediaUrl(raw.default_variant_image) ||
    resolveMediaUrl((dv as { image_url?: string } | null)?.image_url) ||
    listImages[0] ||
    null;

  return {
    id: item.id,
    name: item.name,
    slug: '',
    brand: { id: item.brand_id ?? 0, name: item.brand_name ?? '' },
    category: { id: item.category_id ?? 0, name: item.category_name ?? '', slug: '' },
    images: listImages,
    variants: [],
    basePrice: amount,
    inStock: dv?.in_stock ?? false,
    isActive: true,
    createdAt: '',
    displayPrice: dv?.price?.amount ?? null,
    priceSource: toPriceSource(dv?.price?.source),
    gstRate: dv?.price?.gst_rate ?? null,
    gstAmount: dv?.price?.gst_amount ?? null,
    priceWithGst: dv?.price?.price_with_gst ?? null,
    defaultVariantId: dv?.variant_id ?? null,
    defaultVariantImage: thumb,
    fulfillingWarehouse: mapFulfillingWarehouse(dv?.fulfilling_warehouse),
  };
};


function useStorefrontGeoParams() {
  const lat = useAppSelector((s) => s.location.latitude);
  const lng = useAppSelector((s) => s.location.longitude);
  const pincode = useAppSelector((s) => s.location.pincode);
  return {
    ...(lat != null && lng != null ? { latitude: lat, longitude: lng } : {}),
    ...(pincode && /^\d{6}$/.test(pincode) ? { pincode } : {}),
  };
}

export function useStorefrontProducts(params?: ProductListParams) {
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  const geo = useStorefrontGeoParams();
  const mergedParams = { isActive: true, ...geo, ...params };
  return useQuery({
    queryKey: queryKeys.storefront.list(warehouseId, mergedParams as Record<string, unknown>),
    queryFn: () =>
      apiService.getPaginated<StorefrontProductItemApi[]>(API_ENDPOINTS.STOREFRONT.PRODUCTS, {
        params: mergedParams,
      }),
    select: (resp) => ({
      ...resp,
      data: (resp.data ?? []).map(mapStorefrontItem),
    }),
  });
}

export function useInfiniteStorefrontProducts(params?: Omit<ProductListParams, 'page'>) {
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  const geo = useStorefrontGeoParams();
  const mergedParams = { isActive: true, ...geo, ...params };
  return useInfiniteQuery({
    queryKey: queryKeys.storefront.list(warehouseId, mergedParams as Record<string, unknown>),
    queryFn: ({ pageParam = 1 }) =>
      apiService.getPaginated<StorefrontProductItemApi[]>(API_ENDPOINTS.STOREFRONT.PRODUCTS, {
        params: { ...mergedParams, page: pageParam, limit: 20 },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    select: (data) => ({
      ...data,
      pages: data.pages.map((p) => ({
        ...p,
        data: (p.data ?? []).map(mapStorefrontItem),
      })),
    }),
  });
}

interface StorefrontVariantDetailApi {
  variant_id: number;
  display_name: string;
  sku?: string | null;
  attribute_combination: Record<string, string> | null;
  is_default: boolean;
  is_active_here: boolean;
  in_stock: boolean;
  price: StorefrontPriceApi | null;
  image: string | null;
}

interface StorefrontProductDetailApi {
  id: number;
  name: string;
  description: string | null;
  category_id: number | null;
  category_name: string | null;
  brand_id: number | null;
  brand_name: string | null;
  hsn_code: string | null;
  uom: string | null;
  compatible_machines: string[];
  images: string[];
  variants: StorefrontVariantDetailApi[];
  attributes?: Record<string, string> | null;
  rating?: number | null;
  review_count?: number | null;
}

interface StorefrontProductDetailResponse {
  product: StorefrontProductDetailApi;
  warehouse_resolution: unknown;
}

const mapStorefrontVariant = (v: StorefrontVariantDetailApi): ProductVariant => ({
  id: v.variant_id,
  name: v.display_name,
  sku: v.sku ?? '',
  price: v.price?.amount ?? 0,
  stock: v.in_stock ? 1 : 0,
  attributes: v.attribute_combination ?? {},
  displayPrice: v.price?.amount ?? null,
  priceSource: toPriceSource(v.price?.source),
  gstRate: v.price?.gst_rate ?? null,
  gstAmount: v.price?.gst_amount ?? null,
  priceWithGst: v.price?.price_with_gst ?? null,
  inStock: v.in_stock,
  isDefault: v.is_default,
  image: resolveMediaUrl(v.image ?? (v as { image_url?: string | null }).image_url ?? null),
});

const mapStorefrontDetail = (resp: StorefrontProductDetailResponse): Product => {
  const p = resp.product;
  const variants = (p.variants ?? []).map(mapStorefrontVariant);
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0] ?? null;
  const rawGallery = resolveMediaUrls(p.images ?? []);
  const variantGalleryUrls = [...new Set(variants.map((v) => v.image).filter((u): u is string => !!u))];
  const images =
    rawGallery.length > 0 ? rawGallery : variantGalleryUrls.length > 0 ? variantGalleryUrls : [];
  const productAttributes =
    p.attributes && Object.keys(p.attributes).length > 0 ? p.attributes : undefined;

  return {
    id: p.id,
    name: p.name,
    slug: '',
    description: p.description ?? undefined,
    uom: p.uom ?? undefined,
    compatibleMachines: Array.isArray(p.compatible_machines) ? p.compatible_machines : [],
    hsnCode: p.hsn_code ?? undefined,
    attributes: productAttributes,
    brand: { id: p.brand_id ?? 0, name: p.brand_name ?? '' },
    category: { id: p.category_id ?? 0, name: p.category_name ?? '', slug: '' },
    images,
    variants,
    basePrice: defaultVariant?.price ?? 0,
    inStock: defaultVariant?.inStock ?? false,
    isActive: true,
    createdAt: '',
    rating: p.rating ?? undefined,
    reviewCount: p.review_count ?? undefined,
    displayPrice: defaultVariant?.displayPrice ?? null,
    priceSource: defaultVariant?.priceSource ?? null,
    gstRate: defaultVariant?.gstRate ?? null,
    gstAmount: defaultVariant?.gstAmount ?? null,
    priceWithGst: defaultVariant?.priceWithGst ?? null,
    defaultVariantId: defaultVariant?.id ?? null,
    defaultVariantImage: defaultVariant?.image ?? null,
  };
};

export function useStorefrontProduct(id: string | number) {
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  return useQuery({
    queryKey: queryKeys.storefront.detail(warehouseId, id),
    queryFn: () =>
      apiService.get<StorefrontProductDetailResponse>(API_ENDPOINTS.STOREFRONT.PRODUCT_DETAIL(id)),
    enabled: !!id,
    select: mapStorefrontDetail,
  });
}

export function useDeliveryContext(enabled = true) {
  return useQuery({
    queryKey: queryKeys.storefront.deliveryContext(),
    queryFn: () => apiService.get<DeliveryContext>(API_ENDPOINTS.STOREFRONT.DELIVERY_CONTEXT),
    enabled,
    staleTime: 60_000,
  });
}

export function usePushStorefrontLocation() {
  return useMutation({
    mutationFn: (data: StorefrontLocationRequest) =>
      apiService.post<DeliveryContext>(API_ENDPOINTS.STOREFRONT.LOCATION, data),
  });
}
