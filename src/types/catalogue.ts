export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
}

export interface ProductBrand {
  id: number;
  name: string;
}

export interface VolumeSlabPrice {
  id: number;
  minQty: number;
  maxQty?: number;
  price: number;
  discount?: number;
}

export type PriceSource = 'warehouse' | 'global' | null;

export interface FulfillingWarehouseInfo {
  id: number;
  name: string;
  distanceKm: number | null;
  deliveryCharge: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: number;
  name: string;
  sku: string;
  price: number;
  dealerPrice?: number;
  stock: number;
  attributes: Record<string, string>;
  volumeSlabs?: VolumeSlabPrice[];
  displayPrice?: number | null;
  priceSource?: PriceSource;
  gstRate?: number | null;
  gstAmount?: number | null;
  priceWithGst?: number | null;
  inStock?: boolean;
  isDefault?: boolean;
  image?: string | null;
  images?: string[];
  fulfillingWarehouse?: FulfillingWarehouseInfo | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description?: string;
  uom?: string;
  compatibleMachines?: string[];
  hsnCode?: string;
  attributes?: Record<string, string>;
  brand: ProductBrand;
  category: ProductCategory;
  images: string[];
  variants: ProductVariant[];
  basePrice: number;
  dealerPrice?: number;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
  isActive: boolean;
  createdAt: string;
  displayPrice?: number | null;
  priceSource?: PriceSource;
  gstRate?: number | null;
  gstAmount?: number | null;
  priceWithGst?: number | null;
  defaultVariantId?: number | null;
  defaultVariantImage?: string | null;
  fulfillingWarehouse?: FulfillingWarehouseInfo | null;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  brandId?: number;
  sort?: string;
  isActive?: boolean;
}

export interface ProductListResponse {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
