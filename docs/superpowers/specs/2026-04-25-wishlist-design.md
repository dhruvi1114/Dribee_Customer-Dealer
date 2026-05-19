# Wishlist Feature — Design

**Date:** 2026-04-25
**Status:** Approved (pending implementation plan)

## Summary

Implement a user wishlist in the React Native app that consumes the existing backend `/wishlist` API. Users can favorite product variants from cards and product detail screens, view their wishlist from a dedicated screen reachable via the Profile menu and a header heart icon on Home/Catalogue, and add wishlist items to the cart while keeping them in the wishlist.

## Backend (existing, no changes)

Base path: `/wishlist` — auth required, roles: `customer`, `dealer_owner`.

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/wishlist` | Get wishlist |
| POST   | `/wishlist/items` | Add item (`{ variant_id }`) |
| DELETE | `/wishlist/items/:variantId` | Remove item |
| DELETE | `/wishlist` | Clear wishlist |
| POST   | `/wishlist/items/:variantId/move-to-cart` | Move to cart (not used — see decisions) |

Response shape (`WishlistView`): `{ wishlist_id, items: [{ variant_id, display_name, product_id, product_name, images[], added_at }], count }`.

## Decisions

1. **Access points:** Profile menu entry + heart icon (with badge) in Home/Catalogue headers. No new bottom tab.
2. **Heart icon placement:** On every product/variant card AND on Product Detail screen.
3. **Add to cart from wishlist:** Use cart's existing add endpoint (`useAddCartItem`); item remains in wishlist. Backend's `move-to-cart` endpoint is not used.
4. **Toggle UX:** Optimistic — heart fills/unfills instantly with rollback on error.
5. **Header badge:** Numeric badge on the header heart showing `count` from the wishlist query.
6. **Persistence:** None. React Query cache only; refetch on app open.
7. **Auth-gating:** Heart button hidden for guest users.

## Architecture

Mirrors the existing `cart` module pattern — React Query as the source of truth, snake_case → camelCase mappers, typed service hooks. No Redux slice.

### File layout

**New:**
- `src/types/wishlist.ts` — `WishlistItem`, `Wishlist`, `AddWishlistItemRequest`
- `src/services/wishlist/wishlist.mappers.ts` — `RawWishlistView` → `Wishlist`, `EMPTY_WISHLIST`
- `src/services/wishlist/wishlist.query.ts` — RQ hooks
- `src/components/shared/WishlistHeartButton.tsx` — toggle button (cards + product detail)
- `src/components/shared/WishlistHeaderIcon.tsx` — header icon + badge
- `src/screens/app/wishlist/WishlistScreen.tsx` — list screen

**Modified:**
- `src/utils/constants/api.constant.ts` — add `WISHLIST` endpoints block
- `src/services/react-query/queryKeys.ts` — add `wishlist` keys
- `src/navigation/types.ts` — add `Wishlist: undefined` to app stack param list
- App navigator — register `WishlistScreen`
- `src/screens/app/HomeScreen.tsx`, `catalogue/CatalogueScreen.tsx` — header heart icon
- `src/screens/app/catalogue/ProductDetailScreen.tsx` — heart button near title + header icon
- Product card component (located during implementation) — heart button overlay
- `src/screens/app/profile/ProfileScreen.tsx` — "My Wishlist" menu row

## API constants

```ts
WISHLIST: {
  GET: '/wishlist',
  ADD_ITEM: '/wishlist/items',
  REMOVE_ITEM: (variantId: number) => `/wishlist/items/${variantId}`,
  CLEAR: '/wishlist',
  MOVE_TO_CART: (variantId: number) => `/wishlist/items/${variantId}/move-to-cart`,
}
```

## React Query hooks

- `useWishlist(enabled = true)` — `staleTime: 30_000`, `placeholderData: EMPTY_WISHLIST`.
- `useAddWishlistItem()` — POST `/wishlist/items` with `{ variant_id: String(variantId) }`. Optimistic insert of stub item; rollback on error; success toast "Added to wishlist".
- `useRemoveWishlistItem()` — DELETE; optimistic removal with rollback. No success toast (heart UI is the feedback).
- `useClearWishlist()` — DELETE `/wishlist`; success toast "Wishlist cleared".
- `useIsInWishlist(variantId)` — derived hook reading `useWishlist().data` to check membership in O(n) over items (count is small).

Query keys: `wishlist.all = ['wishlist']`, `wishlist.detail() = ['wishlist','detail']`.

## UI behavior

### WishlistHeartButton
- Hidden when `!isAuthenticated`.
- Reads current state via `useIsInWishlist(variantId)`.
- Filled heart when present, outlined when not. `strokeWidth={1.5}` (lucide-react-native).
- onPress: if present → `removeMutation.mutate(variantId)`; else → `addMutation.mutate({ variantId })`.

### WishlistHeaderIcon
- Heart outline icon with a small numeric badge showing `count` (hidden when 0).
- onPress: navigate to `WishlistScreen`.
- Hidden when `!isAuthenticated`.

### WishlistScreen
- Header: "Wishlist" title + "Clear all" action (confirm dialog → `useClearWishlist`).
- Body: `FlatList` of items.
  - Row: image (`react-native-fast-image`), product name, variant display name, "Added <relative date>" via `date-fns`.
  - Primary button: "Add to Cart" → `useAddCartItem({ variantId, qty: 1 })`. Item remains in wishlist.
  - Secondary action: small × icon → `useRemoveWishlistItem`.
- Empty state: shared `EmptyState` with copy "No items in your wishlist yet".
- Pull-to-refresh wired to `refetch`.
- `keyExtractor`: `String(item.variantId)`.

## Error handling

- All mutations show error toasts via `getApiErrorMessage(err, fallback)`.
- 401s handled by existing `baseService` interceptor.
- Optimistic rollback: `onMutate` snapshots prior cache, `onError` restores it.

## Out of scope

- No MMKV persistence of wishlist.
- No move-to-cart endpoint usage (per decision 3).
- No share / export wishlist.
- No multiple named wishlists.
- No Zod schemas (no form input — just variant IDs).

## Testing (manual smoke)

1. Tap heart on a catalogue card → fills instantly → reopen WishlistScreen → item present.
2. Header badge increments / decrements live across screens.
3. "Add to Cart" from wishlist → cart count rises, wishlist item still listed.
4. "Clear all" → empty state appears, badge goes to 0.
5. Airplane mode + tap heart → fills → unfills with error toast (rollback).
6. Logout → heart buttons and header icon disappear.
