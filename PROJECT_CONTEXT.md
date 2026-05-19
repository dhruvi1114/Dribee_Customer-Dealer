# Project Context — RN CLI Boilerplate

> A single-source reference that explains **what** this project is, **what** we use, **how** we use it, and **why**. Read this before making changes so every contribution matches the existing patterns.

---

## 1. What This Project Is

A production-grade **React Native 0.76 (bare CLI)** boilerplate/app that demonstrates a complete mobile commerce + service booking flow: authentication, catalogue browsing, cart, orders, returns, service bookings, quotations, payments, dealer profiles, and notifications.

It is **not** an Expo project — we use the bare React Native CLI because we need full native access (Firebase, Keychain, MMKV, Bootsplash) and we control both iOS (Xcode) and Android (Gradle) native shells ourselves.

**Supported environments:** `local`, `development`, `production` — selected via the `APP_ENV` variable in npm scripts (see [package.json](package.json)).

---

## 2. Tech Stack — What, How & Why

### 2.1 Core Runtime

| Tool | Version | Why |
|------|---------|-----|
| **React Native** | 0.76.5 | Latest stable with the new architecture-ready bridge. Bare CLI (not Expo) for full native module access. |
| **React** | 18.3.1 | Required by RN 0.76. Concurrent features enabled. |
| **TypeScript** | 5.0.4 | Type safety everywhere. `strict: true` + `verbatimModuleSyntax: true` — forces explicit `import type` to keep build output clean. |
| **Node** | >=18 | Required by Metro + modern tooling. |

### 2.2 Navigation — React Navigation v7

**What:** Native stack + bottom tabs.
**How:** Root `AppNavigator` reads Redux auth state and renders `AuthStack` or `AppTabs`. Each tab has its own nested stack under [src/navigation/stacks/](src/navigation/stacks/). Deep linking config lives in [src/navigation/linking.ts](src/navigation/linking.ts). Param lists in [src/navigation/types.ts](src/navigation/types.ts) give type-safe `navigation.navigate()` calls.
**Why:** v7 gives us better TypeScript ergonomics, smaller native-stack memory footprint, and first-class deep linking. Splitting into per-tab stacks keeps each feature self-contained and lazy-loadable.

### 2.3 Styling — NativeWind v4 + Tailwind CSS

**What:** Tailwind utility classes that compile to RN `StyleSheet` at build time.
**How:** Tailwind config at [tailwind.config.js](tailwind.config.js), global CSS at [global.css](global.css), and the `cn()` helper in [src/lib/utils.ts](src/lib/utils.ts) merges conditional classes (uses `clsx` + `tailwind-merge`).
**Why:** Utility CSS eliminates the StyleSheet boilerplate, keeps styling colocated with JSX, and enforces a consistent design token system (colors, spacing, typography). The primary brand color `#6366F1` (indigo-500) is the one non-negotiable token.

### 2.4 State Management — Redux Toolkit + redux-persist + MMKV

**What:**
- **Redux Toolkit** for client state (auth, cart, notifications).
- **redux-persist** to rehydrate state on app launch.
- **MMKV** as the persist storage backend.

**How:** Slices live in [src/store/slices/](src/store/slices/). Store configured in [src/store/storeSetup.ts](src/store/storeSetup.ts). Always access store via the typed hooks in [src/store/hooks.ts](src/store/hooks.ts) (`useAppSelector`, `useAppDispatch`). Only the **auth slice** is persisted — cart & notifications are intentionally in-memory.

**Why:**
- **Redux (not Context)** — predictable for cross-feature concerns like auth, debuggable with DevTools, and scales with async thunks.
- **MMKV (not AsyncStorage)** — synchronous, ~30× faster, and has native encryption. Perfect for small hot data like auth tokens and user profile.
- **redux-persist** rehydrates before the UI renders, preventing a "logged-out flash" on launch.

### 2.5 Server State — React Query v5 (@tanstack/react-query)

**What:** All server data fetching and mutations.
**How:** Query client in [src/services/react-query/queryClient.ts](src/services/react-query/queryClient.ts), centralized query keys in [src/services/react-query/queryKeys.ts](src/services/react-query/queryKeys.ts). Per-feature hooks live in `src/services/{feature}/{feature}.query.ts`.
**Why:** React Query owns the *server* cache — Redux owns the *client* cache. Keeping them separate avoids the "everything in Redux" anti-pattern, eliminates hand-rolled loading/error state, and gives us free features: background refetch, stale-while-revalidate, optimistic updates.

### 2.6 HTTP — Axios

**What:** HTTP client with interceptors.
**How:**
- [src/services/api/baseService.ts](src/services/api/baseService.ts) — configured Axios instance with a **request interceptor** that injects the JWT from Keychain, and a **response interceptor** that handles `401` by logging out.
- [src/services/api/apiService.ts](src/services/api/apiService.ts) — thin wrapper that auto-unwraps `response.data.data` so callers get the payload directly.
- Endpoints centralized in [src/utils/constants/api.constant.ts](src/utils/constants/api.constant.ts).

**Why:** Interceptors centralize auth + error handling so no call site ever duplicates them. **We always use `PUT` for updates (never PATCH)** — server convention.

### 2.7 Secure Storage — react-native-keychain

**What:** JWT token storage backed by iOS Keychain / Android Keystore.
**How:** Wrapper in [src/lib/keychain.ts](src/lib/keychain.ts).
**Why:** Tokens must not live in MMKV/AsyncStorage (readable on rooted devices). Keychain/Keystore gives hardware-backed encryption.

### 2.8 Forms — React Hook Form + Zod

**What:** Uncontrolled forms + schema validation.
**How:** All Zod schemas **must** live in [src/utils/validations/index.ts](src/utils/validations/index.ts). Never inline a schema in a component. Schema names: `{action}{Entity}Schema` (camelCase). Types: `{Action}{Entity}FormValues` (PascalCase). Resolved with `@hookform/resolvers/zod`.
**Why:**
- **RHF over Formik** — uncontrolled = no re-render per keystroke = huge perf win on RN.
- **Zod** — single source of truth for validation + TypeScript types (infer types from schema, don't duplicate).
- **Centralized schemas** — schemas are reused between screens, mutation bodies, and tests; scattering them leads to drift.

### 2.9 Icons — lucide-react-native (primary) + @expo/vector-icons

**What:** SVG icon set.
**How:** Always render with `strokeWidth={1.5}` for a consistent line weight across the app.
**Why:** Lucide is the community-maintained fork of Feather, tree-shakes cleanly, and has modern icons that Feather lacks.

### 2.10 Animations — Reanimated 3 + Gesture Handler 2

**What:** 60fps animations running on the UI thread.
**How:** Worklets + shared values. Wrapped at root via `GestureHandlerRootView` in [App.tsx](App.tsx).
**Why:** JS-thread animations stutter under load. Reanimated runs on UI thread → always smooth even during heavy lists/re-renders.

### 2.11 Bottom Sheets — @gorhom/bottom-sheet

**What:** Modal bottom sheets (filters, action menus, confirmations).
**Why:** Most battle-tested RN bottom sheet; integrates with Reanimated + Gesture Handler natively.

### 2.12 Toasts — react-native-toast-message

**What:** In-app notification banners.
**How:** Toast is rendered once at the root (see [App.tsx](App.tsx)) and fired imperatively via `Toast.show({ type, text1 })`. **Every mutation must show a toast** on success and error — use `getApiErrorMessage(err, fallback)` from [src/utils/common-functions](src/utils/common-functions/index.ts).
**Why:** Consistent user feedback. Errors must never be swallowed silently.

### 2.13 Images — react-native-fast-image

**What:** `FastImage` component backed by SDWebImage (iOS) and Glide (Android).
**Why:** Native disk/memory caching, progressive loading, priority queues — the default `<Image>` has none of this and re-downloads aggressively.

### 2.14 Dates — date-fns

**Why:** Tree-shakable, immutable, and avoids Moment.js's 300KB footprint and mutable API.

### 2.15 Firebase — @react-native-firebase/{app, messaging, analytics, crashlytics}

**What:** Push notifications (FCM), analytics, and crash reporting.
**Why:** The native-module fork is significantly more reliable than the JS Firebase SDK for RN; FCM only works via native.

### 2.16 Splash — react-native-bootsplash

**Why:** Renders natively before JS boots, so users never see a white flash between launcher icon and first React screen.

### 2.17 Dev Tooling

- **ESLint** + `@react-native/eslint-config` — lint with `--max-warnings 0` (zero tolerance).
- **Jest** + `react-test-renderer` — unit tests.
- **patch-package** — small upstream patches applied on `postinstall`.
- **babel-plugin-module-resolver** — powers the `@/` path alias.
- **react-native-dotenv** — loads `APP_ENV`-specific `.env` files.

---

## 3. Directory Structure & Responsibilities

```
src/
├── components/
│   ├── ui/              Button, Input — primitives. No business logic.
│   ├── shared/          ScreenWrapper, Toast, EmptyState, ErrorBoundary, LoadingScreen, EnvBadge.
│   ├── common/          Header, SkeletonLoader, StatusChip, PrimaryButton, EmptyState.
│   ├── home/            BannerCarousel, CategoryChips, ProductCard.
│   └── orders/          OrderCard, OrderTimeline, NotificationItem.
├── config/              env.ts — resolves APP_ENV → API base URL, flags.
├── constants/           colors, typography, spacing, mockData.
├── hooks/               useDebounce (and index re-exports).
├── lib/                 mmkv, keychain, logger, utils (cn()).
├── navigation/
│   ├── AppNavigator.tsx Auth guard — AuthStack vs AppTabs.
│   ├── AuthStack.tsx    Login, Register, OTP, DealerPending.
│   ├── AppTabs.tsx      Bottom tabs (Home, Catalogue, Services, Orders, Profile, etc).
│   ├── stacks/          Per-tab nested native stacks.
│   ├── types.ts         Param lists — source of truth for navigation typing.
│   └── linking.ts       Deep link URL → route mapping.
├── providers/           AppProviders — composes Redux, PersistGate, QueryClient, SafeArea, Gesture, Theme.
├── screens/
│   ├── SplashScreen.tsx
│   ├── auth/            Login, Register, OTP, DealerPending.
│   └── app/             Tab-gated screens grouped by feature.
├── services/
│   ├── api/             baseService (Axios) + apiService (unwrapper).
│   ├── react-query/     queryClient + queryKeys.
│   └── {feature}/       {feature}.query.ts — React Query hooks per domain.
├── store/
│   ├── hooks.ts         Typed useAppSelector / useAppDispatch.
│   ├── storeSetup.ts    configureStore + persistConfig (MMKV).
│   ├── rootReducer.ts   combineReducers — register new slices HERE.
│   └── slices/          authSlice, cartSlice, notificationsSlice.
├── styles/              theme.ts.
├── theme/               ThemeContext — light/dark switching.
├── types/               One .ts file per domain: auth, order, cart, etc.
└── utils/
    ├── constants/       api, master, app — never duplicate these.
    ├── common-functions/ getApiErrorMessage, date helpers, formatters.
    └── validations/     index.ts (Zod schemas) + helpers.ts.
```

---

## 4. How The App Boots — Step by Step

1. **Native side:** Bootsplash shows native launch screen (iOS storyboard / Android drawable).
2. **index.js:** Registers `App` as the root component.
3. **App.tsx:** Renders `<AppProviders>` → `<AppNavigator>`.
4. **AppProviders** wraps the tree with, in order (outermost → inner):
   - `GestureHandlerRootView` — required by Reanimated/Gesture Handler.
   - `SafeAreaProvider` — insets.
   - `Provider` (Redux) with the configured store.
   - `PersistGate` — blocks render until MMKV rehydration finishes.
   - `QueryClientProvider` (React Query).
   - `ThemeProvider` (light/dark).
   - `BottomSheetModalProvider`.
5. **AppNavigator** reads `state.auth.isAuthenticated`:
   - `false` → renders `AuthStack` (Login/Register/OTP).
   - `true` → renders `AppTabs` (bottom tabs, each with a nested stack).
6. **Splash hides** once the first screen mounts (`BootSplash.hide({ fade: true })`).
7. **Toast host** is mounted at the root so any screen can call `Toast.show(...)`.

---

## 5. How A Feature Is Wired — End to End

Taking **Orders** as the reference pattern:

1. **Type** — [src/types/order.ts](src/types/order.ts) declares `Order`, `OrderStatus`, etc.
2. **API endpoint** — added to `API_ENDPOINTS` in [src/utils/constants/api.constant.ts](src/utils/constants/api.constant.ts).
3. **React Query hook** — [src/services/orders/orders.query.ts](src/services/orders/orders.query.ts) exports `useOrders()`, `useOrderDetail(id)`, `useCancelOrder()`. Queries use the keys from `queryKeys.ts`; mutations fire toasts on success/error.
4. **(If client state is needed)** — slice at `src/store/slices/{feature}Slice.ts` + registered in `rootReducer.ts`.
5. **Screens** — [src/screens/app/orders/](src/screens/app/orders/) consume the hooks.
6. **Navigation** — screen added to `OrdersStack.tsx` and its params typed in `navigation/types.ts`.
7. **Components** — feature-specific UI lives under [src/components/orders/](src/components/orders/).
8. **Validation (if forms)** — Zod schema added to [src/utils/validations/index.ts](src/utils/validations/index.ts), never inlined.

This layering is strict. **Do not** bypass it (e.g. calling Axios directly from a screen, or defining Zod schemas inside a form component).

---

## 6. Hard Rules (from [CLAUDE.md](CLAUDE.md))

1. **Always** use `@/` imports — never `../../`.
2. **Always** use `import type` for type-only imports (`verbatimModuleSyntax` is on).
3. **Named exports** for all components. Exception: `App.tsx` (RN entry requirement).
4. Screen components: PascalCase + `Screen` suffix → `HomeScreen`, `LoginScreen`.
5. Use `useAppSelector` / `useAppDispatch` — never raw `useSelector` / `useDispatch`.
6. GET data via `createAsyncThunk` + `extraReducers` (for Redux) or React Query hooks (for server cache).
7. Mutations: React Query `useMutation` + toast on success/error.
8. Zod schemas: only in [src/utils/validations/index.ts](src/utils/validations/index.ts).
9. HTTP updates: **PUT** (not PATCH).
10. `useCallback` on any handler passed to a memoized child or list item.
11. Lists: `FlatList` (never `ScrollView` for dynamic data).
12. Optional chaining on all nullable access.
13. Stable unique IDs for list keys — never array index.
14. `SafeAreaView` from `react-native-safe-area-context` (not `react-native`).
15. Images: `FastImage` (not `<Image>`).
16. Logging: `logger` from [src/lib/logger.ts](src/lib/logger.ts) — never `console.log` in committed code.
17. Hooks before any early return (Rules of Hooks).
18. Icons: `lucide-react-native`, `strokeWidth={1.5}`.
19. ESLint: `--max-warnings 0`. CI fails on warnings.

---

## 7. Scripts Reference

```bash
# Run
npm run android                 # default env
npm run android:local|dev|prod  # APP_ENV-scoped
npm run ios
npm run ios:local|dev|prod
npm run start                   # Metro
npm run start:clean             # Metro with --reset-cache
npm run start:local|dev|prod    # Metro with APP_ENV + --reset-cache

# Quality gates
npm run build      # tsc --noEmit (type check — no JS output)
npm run type-check # alias of build
npm run lint       # eslint . --max-warnings 0
npm run test       # jest

# iOS
npm run pods       # cd ios && pod install

# Misc
npm run generate-app-icon   # scripts/generate-app-icon.js (sharp-based)
```

---

## 8. Environments

`APP_ENV` is read by `react-native-dotenv` at bundle time.

- **local** — developer machine, localhost/LAN API.
- **development** — shared staging backend.
- **production** — release builds.

The resolved base URL + feature flags live in [src/config/env.ts](src/config/env.ts). `EnvBadge` ([src/components/shared/EnvBadge.tsx](src/components/shared/EnvBadge.tsx)) renders a small on-screen label for non-prod builds so QA never confuses environments.

---

## 9. Domain Feature Map

The app implements the following features (each with its own screen folder, query file, types, and — where needed — slice):

| Feature | Screens | Service |
|---------|---------|---------|
| Auth | Login, Register, OTP, DealerPending | `auth.query.ts` + `authSlice` |
| Home | HomeScreen | via catalogue/services queries |
| Catalogue | Catalogue, ProductDetail, Search | `catalogue.query.ts` |
| Cart | CartScreen | `cart.query.ts` + `cartSlice` |
| Orders | Orders, OrderDetail, Invoice | `orders.query.ts` |
| Returns | SelectItems, Reason, PhotoUpload, Status | `returns.query.ts` |
| Services | Catalogue, BookService, MyBookings, BookingDetail, PartsApproval, FinalBill, OTP, JobRating, Cancellation | `services.query.ts` |
| Quotations | Quotations, QuotationDetail | `quotations.query.ts` |
| Payments | PaymentScreen, PaymentPending, ManualPaymentUpload | `payments.query.ts` |
| Profile | Profile, EditProfile, Addresses, Wishlist | `dealer.query.ts` |
| Notifications | NotificationsScreen | `notifications.query.ts` + `notificationsSlice` |
| Master data | — | `master.query.ts` (dropdowns, enums) |

---

## 10. Why This Architecture (The One-Paragraph Summary)

We split **client state (Redux+MMKV)** from **server state (React Query)**, centralize **schemas, endpoints, and navigation types**, enforce **path aliases and named exports**, and make the **API layer the only place Axios lives**. That gives us: type safety end-to-end (Zod ↔ TS ↔ React Navigation), a single place to change auth/token/401 behavior, zero boilerplate for loading/error UI, hardware-backed token storage, and animations that never drop frames. Every rule above exists to preserve one of those properties — don't break them for convenience.

---

## 11. Quick Navigation

- Rules & conventions → [CLAUDE.md](CLAUDE.md)
- Install + first-run → [INSTALLATION.md](INSTALLATION.md)
- Project deep dive → [PROJECT_GUIDE.md](PROJECT_GUIDE.md)
- Public README → [README.md](README.md)
