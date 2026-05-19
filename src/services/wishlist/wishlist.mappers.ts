import type { Wishlist, WishlistItem } from '@/types/wishlist';

interface RawWishlistItem {
  variant_id: number;
  display_name: string;
  product_id: number;
  product_name: string;
  images: string[];
  added_at: string;
}

export interface RawWishlistView {
  wishlist_id: number;
  items: RawWishlistItem[];
  count: number;
}

const mapItem = (raw: RawWishlistItem): WishlistItem => ({
  variantId: raw.variant_id,
  displayName: raw.display_name,
  productId: raw.product_id,
  productName: raw.product_name,
  images: raw.images,
  addedAt: raw.added_at,
});

export const mapWishlistView = (raw: RawWishlistView): Wishlist => ({
  wishlistId: raw.wishlist_id,
  items: raw.items.map(mapItem),
  count: raw.count,
});

export const EMPTY_WISHLIST: Wishlist = {
  wishlistId: null,
  items: [],
  count: 0,
};
