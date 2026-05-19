export interface WishlistItem {
  variantId: number;
  displayName: string;
  productId: number;
  productName: string;
  images: string[];
  addedAt: string;
}

export interface Wishlist {
  wishlistId: number | null;
  items: WishlistItem[];
  count: number;
}

export interface AddWishlistItemRequest {
  variantId: number;
}
