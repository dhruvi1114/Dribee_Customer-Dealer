import { useQuery, useInfiniteQuery } from '@tanstack/react-query';

import { apiService } from '@/services/api/apiService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { useAppSelector } from '@/store/hooks';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { resolveMediaUrls } from '@/utils/resolveMediaUrl';
import type { Product, ProductListParams, ProductVariant } from '@/types/catalogue';

interface CatalogueAttributeValue {
  attribute_id: string;
  attribute_name: string;
  data_type: string;
  value: string;
}

interface CatalogueVariantApi {
  id: string | number;
  images?: string[];
}

interface CatalogueProductDetailApi {
  id: string | number;
  name: string;
  description: string | null;
  category_id: string | null;
  category_name: string | null;
  brand_id: string | null;
  brand_name: string | null;
  hsn_code: string | null;
  unit_name: string | null;
  compatible_machines: string[];
  images: string[];
  attribute_values?: CatalogueAttributeValue[];
  variants?: CatalogueVariantApi[];
  is_active: boolean;
  created_at: string;
  in_stock: boolean;
  display_price: number | null;
  default_variant_id: number | null;
}

function mapCatalogueProduct(raw: CatalogueProductDetailApi): Product {
  const attributes: Record<string, string> = {};
  for (const av of raw.attribute_values ?? []) {
    if (av.data_type !== 'select') {
      attributes[av.attribute_name] = av.value;
    }
  }
  const variants: ProductVariant[] = (raw.variants ?? []).map((v) => ({
    id: Number(v.id),
    name: '',
    sku: '',
    price: 0,
    stock: 0,
    attributes: {},
    images: resolveMediaUrls(v.images ?? []),
  }));
  return {
    id: Number(raw.id),
    name: raw.name,
    slug: '',
    description: raw.description ?? undefined,
    uom: raw.unit_name ?? undefined,
    hsnCode: raw.hsn_code ?? undefined,
    compatibleMachines: Array.isArray(raw.compatible_machines) ? raw.compatible_machines : [],
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    brand: { id: Number(raw.brand_id ?? 0), name: raw.brand_name ?? '' },
    category: { id: Number(raw.category_id ?? 0), name: raw.category_name ?? '', slug: '' },
    images: [],
    variants,
    basePrice: raw.display_price ?? 0,
    inStock: raw.in_stock ?? false,
    isActive: raw.is_active ?? true,
    createdAt: raw.created_at ?? '',
    defaultVariantId: raw.default_variant_id ?? null,
  };
}

export function useProducts(params?: ProductListParams) {
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  const mergedParams = { isActive: true, ...params };
  return useQuery({
    queryKey: queryKeys.catalogue.list(warehouseId, mergedParams as Record<string, unknown>),
    queryFn: () =>
      apiService.getPaginated<Product[]>(API_ENDPOINTS.CATALOGUE.PRODUCTS, { params: mergedParams }),
  });
}

export function useInfiniteProducts(params?: Omit<ProductListParams, 'page'>) {
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  const mergedParams = { isActive: true, ...params };
  return useInfiniteQuery({
    queryKey: queryKeys.catalogue.list(warehouseId, mergedParams as Record<string, unknown>),
    queryFn: ({ pageParam = 1 }) =>
      apiService.getPaginated<Product[]>(API_ENDPOINTS.CATALOGUE.PRODUCTS, {
        params: { ...mergedParams, page: pageParam, limit: 20 },
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
  });
}

export function useProduct(id: string | number) {
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  return useQuery({
    queryKey: queryKeys.catalogue.detail(warehouseId, id),
    queryFn: () => apiService.get<CatalogueProductDetailApi>(API_ENDPOINTS.CATALOGUE.PRODUCT_DETAIL(id)),
    enabled: !!id,
    select: mapCatalogueProduct,
  });
}

export function useProductVariants(productId: string | number) {
  const warehouseId = useAppSelector((s) => s.location.warehouseId);
  return useQuery({
    queryKey: queryKeys.catalogue.variants(warehouseId, productId),
    queryFn: () =>
      apiService.get<ProductVariant[]>(API_ENDPOINTS.CATALOGUE.PRODUCT_VARIANTS(productId)),
    enabled: !!productId,
  });
}
