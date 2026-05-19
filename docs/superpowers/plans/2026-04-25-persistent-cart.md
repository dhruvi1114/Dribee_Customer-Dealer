# Persistent Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the React Native dealer/customer cart from a Redux-only local model to the backend's persistent server cart so the cart syncs across devices and uses server-authoritative pricing, coupons, and checkout.

**Architecture:** React Query becomes the single source of truth for cart state via a `useCart()` query keyed under `queryKeys.cart`. All mutations (add, update qty, remove, clear, set-address, set-coupon, remove-coupon, checkout) optimistically update the query cache and invalidate on settle. The existing `cartSlice` is reduced to UI-only ephemeral state (currently nothing — slice is removed). `ProductDetailScreen` calls `useAddCartItem`. `CartScreen` reads from `useCart()` and calls per-line mutations. Checkout uses `POST /cart/checkout` instead of `POST /orders`.

**Tech Stack:** React Native 0.76, React Query v5, Redux Toolkit (being phased out for cart), Axios via `apiService`, TypeScript, NativeWind, react-native-toast-message.

---

## File Structure

**Create:**
- `src/types/cart.ts` — server cart types (`ServerCart`, `ServerCartItem`, request payloads)
- `src/services/cart/cart.query.ts` — REPLACE existing file with full server-cart hooks
- `src/services/react-query/queryKeys.ts` — add `cart` key namespace (modify)

**Modify:**
- `src/utils/constants/api.constant.ts` — add new CART endpoints
- `src/screens/app/cart/CartScreen.tsx` — switch from Redux to `useCart()` + mutation hooks
- `src/screens/app/catalogue/ProductDetailScreen.tsx` — switch `addToCart` Redux action to `useAddCartItem`
- `src/screens/app/payment/PaymentScreen.tsx` — switch `useCreateOrder` to `useCheckoutCart`
- `src/store/rootReducer.ts` — remove `cart` reducer registration
- `src/store/storeSetup.ts` — remove `cart` from persist whitelist if present
- `src/hooks/useCartReprice.ts` — DELETE (server cart prices itself)

**Delete:**
- `src/store/slices/cartSlice.ts` — replaced by server-side cart

---

## Task 1: Add server cart endpoint constants

**Files:**
- Modify: `src/utils/constants/api.constant.ts`

- [ ] **Step 1: Add new endpoints to the CART namespace**

Replace the existing `CART` block in `src/utils/constants/api.constant.ts` (currently lines 32-35) with:

```typescript
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: (variantId: string | number) => `/cart/items/${variantId}`,
    REMOVE_ITEM: (variantId: string | number) => `/cart/items/${variantId}`,
    CLEAR: '/cart',
    SET_ADDRESS: '/cart/address',
    SET_COUPON: '/cart/coupon',
    REMOVE_COUPON: '/cart/coupon',
    CHECKOUT: '/cart/checkout',
    VALIDATE: '/cart/validate',
    APPLY_COUPON: '/cart/apply-coupon',
  },
```

(Note: `VALIDATE` and `APPLY_COUPON` are kept for back-compat during transition; remove later in Task 9.)

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: Pass with no errors. If a stale reference to old CART shape fails, note the file and continue — Task 6 will fix consumers.

- [ ] **Step 3: Commit**

```bash
git add src/utils/constants/api.constant.ts
git commit -m "feat(cart): add persistent cart endpoint constants"
```
*(Skip if not in a git repo.)*

---

## Task 2: Define server cart types

**Files:**
- Create: `src/types/cart.ts`

- [ ] **Step 1: Create the types file**

Write `src/types/cart.ts`:

```typescript
export interface ServerCartItem {
  variantId: number;
  productId: number;
  productName: string;
  variantName: string;
  sku?: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  image?: string;
  warehouseId?: number | null;
  unavailable?: boolean;
  volumeSlabs?: Array<{
    id: number;
    minQty: number;
    maxQty?: number;
    price: number;
    discount?: number;
  }>;
}

export interface ServerCart {
  id: number | null;
  items: ServerCartItem[];
  warehouseId: number | null;
  addressId: number | null;
  couponCode: string | null;
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  errors?: string[];
}

export interface AddCartItemRequest {
  variantId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface SetCartAddressRequest {
  addressId: number;
}

export interface SetCartCouponRequest {
  couponCode: string;
}

export interface CheckoutCartRequest {
  paymentMethodId?: string | number;
  notes?: string;
}

export interface CheckoutCartResponse {
  orderId: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: Pass.

- [ ] **Step 3: Commit**

```bash
git add src/types/cart.ts
git commit -m "feat(cart): add server cart types"
```

---

## Task 3: Add cart query key namespace

**Files:**
- Modify: `src/services/react-query/queryKeys.ts`

- [ ] **Step 1: Read the existing keys file**

Run: `cat src/services/react-query/queryKeys.ts`
Confirm there is an exported `queryKeys` object.

- [ ] **Step 2: Add `cart` namespace**

Inside the `queryKeys` object, add:

```typescript
  cart: {
    all: ['cart'] as const,
    detail: () => ['cart', 'detail'] as const,
  },
```

(Place alphabetically among existing entries. The `detail()` key is what `useCart()` uses; `all` is for invalidation.)

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: Pass.

- [ ] **Step 4: Commit**

```bash
git add src/services/react-query/queryKeys.ts
git commit -m "feat(cart): add cart query key namespace"
```

---

## Task 4: Replace cart.query.ts with server cart hooks

**Files:**
- Modify: `src/services/cart/cart.query.ts` (full rewrite)

- [ ] **Step 1: Replace file contents**

Overwrite `src/services/cart/cart.query.ts` with:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { apiService } from '@/services/api/apiService';
import { queryKeys } from '@/services/react-query/queryKeys';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';
import type {
  ServerCart,
  AddCartItemRequest,
  UpdateCartItemRequest,
  SetCartAddressRequest,
  SetCartCouponRequest,
  CheckoutCartRequest,
  CheckoutCartResponse,
} from '@/types/cart';

const EMPTY_CART: ServerCart = {
  id: null,
  items: [],
  warehouseId: null,
  addressId: null,
  couponCode: null,
  subtotal: 0,
  discount: 0,
  gst: 0,
  total: 0,
};

export function useCart(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cart.detail(),
    queryFn: () => apiService.get<ServerCart>(API_ENDPOINTS.CART.GET),
    enabled,
    staleTime: 30_000,
    placeholderData: EMPTY_CART,
  });
}

export function useAddCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCartItemRequest) =>
      apiService.post<ServerCart>(API_ENDPOINTS.CART.ADD_ITEM, data),
    onSuccess: (cart) => {
      qc.setQueryData(queryKeys.cart.detail(), cart);
      Toast.show({ type: 'success', text1: 'Added to cart' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to add to cart') });
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: number; quantity: number }) =>
      apiService.put<ServerCart>(
        API_ENDPOINTS.CART.UPDATE_ITEM(variantId),
        { quantity } satisfies UpdateCartItemRequest,
      ),
    onMutate: async ({ variantId, quantity }) => {
      await qc.cancelQueries({ queryKey: queryKeys.cart.detail() });
      const prev = qc.getQueryData<ServerCart>(queryKeys.cart.detail());
      if (prev) {
        qc.setQueryData<ServerCart>(queryKeys.cart.detail(), {
          ...prev,
          items: prev.items.map((it) =>
            it.variantId === variantId ? { ...it, qty: quantity } : it,
          ),
        });
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.cart.detail(), ctx.prev);
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to update item') });
    },
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart.detail(), cart),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantId: number) =>
      apiService.delete<ServerCart>(API_ENDPOINTS.CART.REMOVE_ITEM(variantId)),
    onSuccess: (cart) => {
      qc.setQueryData(queryKeys.cart.detail(), cart);
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to remove item') });
    },
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.delete<ServerCart>(API_ENDPOINTS.CART.CLEAR),
    onSuccess: (cart) => {
      qc.setQueryData(queryKeys.cart.detail(), cart);
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to clear cart') });
    },
  });
}

export function useSetCartAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetCartAddressRequest) =>
      apiService.put<ServerCart>(API_ENDPOINTS.CART.SET_ADDRESS, data),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart.detail(), cart),
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to set address') });
    },
  });
}

export function useSetCartCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetCartCouponRequest) =>
      apiService.put<ServerCart>(API_ENDPOINTS.CART.SET_COUPON, data),
    onSuccess: (cart) => {
      qc.setQueryData(queryKeys.cart.detail(), cart);
      Toast.show({ type: 'success', text1: 'Coupon applied' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Invalid coupon') });
    },
  });
}

export function useRemoveCartCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiService.delete<ServerCart>(API_ENDPOINTS.CART.REMOVE_COUPON),
    onSuccess: (cart) => qc.setQueryData(queryKeys.cart.detail(), cart),
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to remove coupon') });
    },
  });
}

export function useCheckoutCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckoutCartRequest) =>
      apiService.post<CheckoutCartResponse>(API_ENDPOINTS.CART.CHECKOUT, data),
    onSuccess: () => {
      qc.setQueryData(queryKeys.cart.detail(), {
        id: null,
        items: [],
        warehouseId: null,
        addressId: null,
        couponCode: null,
        subtotal: 0,
        discount: 0,
        gst: 0,
        total: 0,
      });
      void qc.invalidateQueries({ queryKey: ['orders'] });
      Toast.show({ type: 'success', text1: 'Order placed successfully' });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Checkout failed') });
    },
  });
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Expected: Errors only in files that still import the deleted `useValidateCart`/`useApplyCoupon` (CartScreen). Tasks 6 will fix.

- [ ] **Step 3: Commit**

```bash
git add src/services/cart/cart.query.ts
git commit -m "feat(cart): add server cart hooks (get/add/update/remove/clear/coupon/checkout)"
```

---

## Task 5: Update ProductDetailScreen to use server cart

**Files:**
- Modify: `src/screens/app/catalogue/ProductDetailScreen.tsx`

- [ ] **Step 1: Locate the current addToCart usage**

Run: `grep -n "addToCart\|cartSlice\|useAppDispatch" src/screens/app/catalogue/ProductDetailScreen.tsx`
Note line numbers for the import, the `useAppDispatch()` call, and each `dispatch(addToCart(...))` site.

- [ ] **Step 2: Replace Redux dispatch with mutation**

In the file:

1. Remove the import of `addToCart` from `@/store/slices/cartSlice` and the `useAppDispatch` import if it's only used for cart.
2. Add: `import { useAddCartItem } from '@/services/cart/cart.query';`
3. Replace `const dispatch = useAppDispatch();` with `const addItem = useAddCartItem();` (keep dispatch only if still used for non-cart actions).
4. Replace each `dispatch(addToCart({ variantId, qty, ... }))` call with:

```typescript
addItem.mutate({ variantId: selectedVariant.id, quantity: qty });
```

(`qty` here is whatever local quantity state the screen currently passes — keep that exact variable name.)

5. If the existing handler is named e.g. `handleAddToCart`, wrap the mutation call inside it; do NOT change the handler signature.

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: Pass for this file.

- [ ] **Step 4: Manual smoke test**

Run: `npm run start:clean` then `npm run android` (or `npm run ios`).
Steps:
1. Open a product → tap Add to Cart.
2. Confirm toast "Added to cart".
3. Open Cart tab — item should appear (after Task 6).

If app errors before Task 6 is done, that's expected — proceed.

- [ ] **Step 5: Commit**

```bash
git add src/screens/app/catalogue/ProductDetailScreen.tsx
git commit -m "feat(cart): wire ProductDetail Add-to-Cart to server cart"
```

---

## Task 6: Rewrite CartScreen against server cart

**Files:**
- Modify: `src/screens/app/cart/CartScreen.tsx`

- [ ] **Step 1: Swap data source and handlers**

Replace the top of the file (imports + component body up to `handleRemoveCoupon`) with:

```typescript
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Trash2, Minus, Plus, Tag, X } from 'lucide-react-native';

import { useTheme } from '@/theme/ThemeContext';
import { Header } from '@/components/common/Header';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { useAppSelector } from '@/store/hooks';
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useSetCartCoupon,
  useRemoveCartCoupon,
} from '@/services/cart/cart.query';
import { applyVolumeSlab } from '@/utils/common-functions/volume-slabs';
import { Typography } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import type { OrdersStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<OrdersStackParamList>;

export function CartScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();

  const { data: cart, isLoading } = useCart();
  const location = useAppSelector((s) => s.location);
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const setCoupon = useSetCartCoupon();
  const removeCoupon = useRemoveCartCoupon();
  const [couponInput, setCouponInput] = useState('');

  const items = cart?.items ?? [];
  const couponCode = cart?.couponCode ?? null;
  const cartWarehouseId = cart?.warehouseId ?? null;
  const warehouseMismatch =
    cartWarehouseId != null &&
    location.warehouseId != null &&
    cartWarehouseId !== location.warehouseId;
  const canCheckout = location.canOrder && !warehouseMismatch && items.length > 0;

  const handleUpdateQty = useCallback(
    (variantId: number, delta: number, currentQty: number) => {
      const next = Math.max(1, currentQty + delta);
      if (next === currentQty) return;
      updateItem.mutate({ variantId, quantity: next });
    },
    [updateItem],
  );

  const handleRemove = useCallback(
    (variantId: number) => removeItem.mutate(variantId),
    [removeItem],
  );

  const handleApplyCoupon = useCallback(() => {
    if (!couponInput.trim()) return;
    const code = couponInput.trim().toUpperCase();
    setCoupon.mutate({ couponCode: code });
    setCouponInput('');
  }, [couponInput, setCoupon]);

  const handleRemoveCoupon = useCallback(() => removeCoupon.mutate(), [removeCoupon]);
```

- [ ] **Step 2: Adjust the totals computation**

Remove the existing `lineBreakdowns / subtotal / volumeSavings / discount / gst / total` block. Replace with:

```typescript
  const lineBreakdowns = items.map((item) => {
    const slab = applyVolumeSlab(item.unitPrice, item.qty, item.volumeSlabs);
    return { item, slab };
  });
  const subtotal = cart?.subtotal ?? 0;
  const discount = cart?.discount ?? 0;
  const gst = cart?.gst ?? 0;
  const total = cart?.total ?? 0;
  const volumeSavings = lineBreakdowns.reduce((s, l) => s + l.slab.amountSaved, 0);
```

- [ ] **Step 3: Update item-row references**

Replace any reference in the FlatList renderItem to `item.price` with `item.unitPrice`. Replace `item.productName` access on `CartItem` with the new `ServerCartItem.productName` (same name — no change needed). Replace `keyExtractor={({ item }) => String(item.variantId)}` — unchanged.

The slab line that currently reads `slab.lineTotal` stays; it's computed from `unitPrice * qty`.

- [ ] **Step 4: Add a loading guard**

Just after `<Header ...>` and before the `cart.items.length === 0` ternary, insert:

```typescript
      {isLoading && !cart ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator color={colors.brandNavy} />
        </View>
      ) : items.length === 0 ? (
```

And change the existing `{cart.items.length === 0 ? (` line to be the second branch of this ternary (the rest of the JSX is unchanged except `cart.items` → `items` and `cart.couponCode` → `couponCode` everywhere it appears in the JSX block).

- [ ] **Step 5: Update checkout handler**

Replace the existing `handleCheckout`:

```typescript
  const handleCheckout = useCallback(() => {
    navigation.navigate('Payment', { amount: total });
  }, [navigation, total]);
```

(unchanged — checkout itself happens in PaymentScreen via Task 7).

- [ ] **Step 6: Type-check**

Run: `npm run build`
Expected: Pass.

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: Pass for this file.

- [ ] **Step 8: Manual smoke test**

Restart Metro, open Cart screen:
1. Cart should hydrate from `GET /cart`.
2. + / − should debounce-update via `PUT /cart/items/:variantId`.
3. Trash icon should `DELETE /cart/items/:variantId`.
4. Apply coupon should `PUT /cart/coupon`; chip should appear.
5. Tapping the chip should `DELETE /cart/coupon`.

- [ ] **Step 9: Commit**

```bash
git add src/screens/app/cart/CartScreen.tsx
git commit -m "feat(cart): rewrite CartScreen against server cart"
```

---

## Task 7: Switch checkout to /cart/checkout in PaymentScreen

**Files:**
- Modify: `src/screens/app/payment/PaymentScreen.tsx`

- [ ] **Step 1: Identify current checkout call**

Run: `grep -n "useCreateOrder\|createOrder\|navigate.*PaymentPending\|paymentMethod" src/screens/app/payment/PaymentScreen.tsx`

Locate the place where `useCreateOrder().mutate(...)` is invoked.

- [ ] **Step 2: Replace with useCheckoutCart**

In the file:

1. Replace `import { useCreateOrder } from '@/services/orders/orders.query';` with `import { useCheckoutCart } from '@/services/cart/cart.query';`.
2. Replace `const createOrder = useCreateOrder();` with `const checkout = useCheckoutCart();`.
3. Replace the existing `createOrder.mutate({...})` body. The new payload is much smaller — the server cart already knows items, address, coupon, warehouse. Only payment method and notes remain:

```typescript
checkout.mutate(
  { paymentMethodId: selectedPaymentMethod?.id, notes },
  {
    onSuccess: (res) => {
      navigation.navigate('PaymentPending', { orderId: res.orderId });
    },
  },
);
```

(Use the actual local variable names already in the screen for `selectedPaymentMethod` and `notes`. If notes is not collected on this screen, omit it.)

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: Pass.

- [ ] **Step 4: Manual smoke test**

1. Add items to cart.
2. Tap Checkout → Payment screen → choose payment method → Pay.
3. Confirm `POST /cart/checkout` fires (network tab / Reactotron).
4. Confirm navigation to PaymentPending with the new orderId.
5. Confirm cart is empty after returning.

- [ ] **Step 5: Commit**

```bash
git add src/screens/app/payment/PaymentScreen.tsx
git commit -m "feat(cart): use /cart/checkout instead of POST /orders"
```

---

## Task 8: Remove Redux cart slice

**Files:**
- Delete: `src/store/slices/cartSlice.ts`
- Delete: `src/hooks/useCartReprice.ts`
- Modify: `src/store/rootReducer.ts`
- Modify: `src/store/storeSetup.ts`

- [ ] **Step 1: Confirm there are no remaining consumers**

Run:

```bash
grep -rn "from '@/store/slices/cartSlice'\|cartSlice\|useCartReprice" src --include="*.ts" --include="*.tsx"
```

Expected: zero results (after Tasks 5-7). If any remain, fix them by routing the call through the new server-cart hooks.

- [ ] **Step 2: Delete the slice**

```bash
rm src/store/slices/cartSlice.ts src/hooks/useCartReprice.ts
```

- [ ] **Step 3: Remove cart from rootReducer**

Read `src/store/rootReducer.ts`. Delete the `import cartReducer from './slices/cartSlice';` line and the `cart: cartReducer,` entry inside `combineReducers`.

- [ ] **Step 4: Remove cart from persist whitelist**

Read `src/store/storeSetup.ts`. If `whitelist` contains `'cart'`, remove it.

- [ ] **Step 5: Update RootState consumers**

Run: `grep -rn "state.cart\|s.cart" src --include="*.ts" --include="*.tsx"`
Expected: zero results. Fix any leftovers.

- [ ] **Step 6: Type-check + lint**

Run: `npm run build && npm run lint`
Expected: Pass.

- [ ] **Step 7: Manual smoke test (full regression)**

1. Cold-start the app, log in, browse a product, add to cart.
2. Force-quit and reopen — cart should still be there (now server-backed, not MMKV).
3. Log out and back in on a second device (or simulator) — cart should follow the user.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(cart): remove Redux cart slice and useCartReprice (server cart is source of truth)"
```

---

## Task 9: Drop legacy stateless cart endpoints

**Files:**
- Modify: `src/utils/constants/api.constant.ts`
- Modify: `src/services/cart/cart.query.ts` (if any legacy hook still exported)

- [ ] **Step 1: Confirm no consumers reference VALIDATE / APPLY_COUPON**

Run:

```bash
grep -rn "CART.VALIDATE\|CART.APPLY_COUPON\|useValidateCart\|useApplyCoupon" src --include="*.ts" --include="*.tsx"
```

Expected: zero results.

- [ ] **Step 2: Remove the legacy entries**

In `src/utils/constants/api.constant.ts`, delete these two lines from the `CART` block:

```typescript
    VALIDATE: '/cart/validate',
    APPLY_COUPON: '/cart/apply-coupon',
```

- [ ] **Step 3: Type-check + lint**

Run: `npm run build && npm run lint`
Expected: Pass.

- [ ] **Step 4: Commit**

```bash
git add src/utils/constants/api.constant.ts
git commit -m "chore(cart): drop legacy /cart/validate and /cart/apply-coupon constants"
```

---

## Self-Review

**Spec coverage:**
- Persistent cart hydration → Task 4 (`useCart`)
- Add / update / remove / clear → Tasks 4, 5, 6
- Set address → Task 4 hook present (consumer wiring deferred until checkout-address UI exists; not blocking)
- Set / remove coupon → Tasks 4, 6
- Checkout → Tasks 4, 7
- Redux cleanup → Task 8
- Legacy cleanup → Task 9

**Placeholder scan:** None — every step has concrete code or a concrete command.

**Type consistency:** `ServerCart`/`ServerCartItem` field names (`unitPrice`, `qty`, `productName`, `volumeSlabs`) are used consistently across Task 2 (definition), Task 4 (hooks), Task 6 (CartScreen). `useAddCartItem` payload uses `quantity` (server convention) consistently.

**Open assumption:** The backend's persistent cart response shape is assumed to match `ServerCart`. If the live response differs, only `src/types/cart.ts` and the JSX field references in CartScreen need adjustment.
