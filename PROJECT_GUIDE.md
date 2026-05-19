# Project Guide — RN CLI Boilerplate

A production-ready React Native CLI boilerplate with authentication, navigation, state management, API layer, form validation, and styling — all pre-configured and ready to build on.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Folder Structure](#folder-structure)
3. [Architecture Overview](#architecture-overview)
4. [App Entry Point](#app-entry-point)
5. [Navigation](#navigation)
6. [State Management (Redux)](#state-management-redux)
7. [API Layer](#api-layer)
8. [React Query (Server State)](#react-query-server-state)
9. [Forms & Validation](#forms--validation)
10. [UI Components](#ui-components)
11. [Styling (NativeWind)](#styling-nativewind)
12. [Utilities & Helpers](#utilities--helpers)
13. [Adding a New Feature (Step-by-Step)](#adding-a-new-feature-step-by-step)
14. [Coding Conventions](#coding-conventions)

---

## Tech Stack

| Category           | Library                                   |
| ------------------ | ----------------------------------------- |
| Framework          | React Native 0.76 + TypeScript 5          |
| Navigation         | React Navigation v7 (native stack + tabs) |
| Styling            | NativeWind v4 (Tailwind CSS)              |
| Client State       | Redux Toolkit + redux-persist + MMKV      |
| Server State       | React Query v5 (TanStack Query)           |
| Forms              | React Hook Form + Zod                     |
| HTTP Client        | Axios                                     |
| Auth Token Storage | react-native-keychain                     |
| Icons              | Lucide React Native                       |
| Animations         | React Native Reanimated                   |
| Gestures           | React Native Gesture Handler              |
| Bottom Sheets      | @gorhom/bottom-sheet                      |
| Toasts             | react-native-toast-message                |
| Images             | react-native-fast-image                   |
| Push Notifications | @react-native-firebase/messaging          |
| Analytics          | @react-native-firebase/analytics          |
| Crash Reporting    | @react-native-firebase/crashlytics        |
| Date Utilities     | date-fns                                  |

---

## Folder Structure

```
src/
├── components/
│   ├── ui/                    # Base primitives (Button, Input)
│   │   ├── Button.tsx         # AppButton — multi-variant button
│   │   ├── Input.tsx          # AppInput — text input with label, error, password toggle
│   │   └── index.ts           # Barrel export
│   └── shared/                # Reusable across screens
│       ├── EmptyState.tsx     # Empty list placeholder
│       ├── ErrorBoundary.tsx  # Top-level error catch
│       ├── LoadingScreen.tsx  # Full-screen loader (used by PersistGate)
│       ├── ScreenWrapper.tsx  # SafeAreaView + padding wrapper
│       ├── Toast.tsx          # Custom toast config
│       └── index.ts           # Barrel export
│
├── constants/
│   └── colors.ts              # Color palette (primary, gray, success, etc.)
│
├── hooks/
│   ├── useDebounce.ts         # Debounce hook for search inputs
│   └── index.ts               # Barrel export
│
├── lib/
│   ├── utils.ts               # cn() — Tailwind class merge utility
│   ├── logger.ts              # Dev-safe logging (replaces console.log)
│   ├── mmkv.ts                # MMKV storage instance (for redux-persist)
│   └── keychain.ts            # Secure token storage (get/set/remove)
│
├── navigation/
│   ├── types.ts               # Type-safe param lists for all navigators
│   ├── AppNavigator.tsx       # Root navigator — auth guard logic
│   ├── AuthStack.tsx          # Login → Register stack
│   ├── AppTabs.tsx            # Bottom tab navigator (Home, Profile, Settings)
│   └── linking.ts             # Deep linking configuration
│
├── providers/
│   └── AppProviders.tsx       # Wraps app with all providers (Redux, Query, etc.)
│
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx    # Login form with demo credentials
│   │   └── RegisterScreen.tsx # Registration form
│   └── app/
│       ├── HomeScreen.tsx     # Main home screen
│       ├── ProfileScreen.tsx  # User profile screen
│       └── SettingsScreen.tsx # Settings with logout
│
├── services/
│   ├── api/
│   │   ├── baseService.ts     # Axios instance + token interceptor + 401 handler
│   │   └── apiService.ts      # Wrapper that unwraps response.data.data
│   └── react-query/
│       ├── queryClient.ts     # QueryClient with default options
│       └── queryKeys.ts       # Hierarchical query key factory
│
├── store/
│   ├── hooks.ts               # Typed useAppSelector & useAppDispatch
│   ├── rootReducer.ts         # combineReducers — register slices here
│   ├── storeSetup.ts          # configureStore + MMKV persist (auth whitelisted)
│   └── slices/
│       └── authSlice.ts       # Auth state (isAuthenticated, user, logout)
│
├── styles/
│   └── theme.ts               # Theme definitions
│
├── types/
│   ├── auth.ts                # User, LoginRequest, AuthResponse types
│   └── common.ts              # ApiResponse<T>, PaginatedResponse<T>, ListParams
│
└── utils/
    ├── constants/
    │   ├── api.constant.ts    # API_BASE_URL + API_ENDPOINTS object
    │   ├── app.constant.ts    # App-level constants
    │   └── master.constant.ts # Master/config constants
    ├── common-functions/
    │   └── index.ts           # getApiErrorMessage() helper
    └── validations/
        ├── helpers.ts         # Reusable Zod field definitions (email, password)
        └── index.ts           # All Zod schemas + inferred types
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│                   App.tsx                    │
│  ErrorBoundary → AppProviders → AppNavigator│
└─────────────────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │        AppProviders        │
        │  GestureHandler            │
        │  └─ Redux (+ PersistGate)  │
        │     └─ React Query         │
        │        └─ BottomSheet      │
        │           └─ SafeArea      │
        │              └─ children   │
        │              └─ Toast      │
        └────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │       AppNavigator         │
        │  isAuthenticated?          │
        │  ├── YES → AppTabs         │
        │  │   ├── Home              │
        │  │   ├── Profile           │
        │  │   └── Settings          │
        │  └── NO  → AuthStack       │
        │      ├── Login             │
        │      └── Register          │
        └────────────────────────────┘
```

**Data flow:**

- **Client state** (auth, UI) → Redux Toolkit + MMKV persistence
- **Server state** (API data) → React Query (caching, refetching)
- **Auth tokens** → react-native-keychain (secure storage)
- **API calls** → Axios with auto token attachment + 401 handling

---

## App Entry Point

`App.tsx` is the root component:

```tsx
<ErrorBoundary>
  <AppProviders>
    <StatusBar />
    <AppNavigator />
  </AppProviders>
</ErrorBoundary>
```

**AppProviders** wraps everything in this order (outermost → innermost):

1. `GestureHandlerRootView` — required by gesture handler & bottom sheet
2. `ReduxProvider` — Redux store
3. `PersistGate` — waits for MMKV rehydration, shows `LoadingScreen`
4. `QueryClientProvider` — React Query
5. `BottomSheetModalProvider` — bottom sheet support
6. `SafeAreaProvider` — safe area insets
7. `ToastMessage` — toast notifications (rendered at root level)

---

## Navigation

### Structure

The app uses **React Navigation v7** with three navigators:

| Navigator   | Type         | Screens                 |
| ----------- | ------------ | ----------------------- |
| `RootStack` | Native Stack | Auth, App               |
| `AuthStack` | Native Stack | Login, Register         |
| `AppTabs`   | Bottom Tabs  | Home, Profile, Settings |

### Auth Guard

`AppNavigator.tsx` reads `isAuthenticated` from the Redux auth slice:

- **Authenticated** → shows `AppTabs` (Home, Profile, Settings)
- **Not authenticated** → shows `AuthStack` (Login, Register)

There's no manual navigation for login/logout. Just update the Redux state and the navigator switches automatically.

### Type-Safe Navigation

All param lists are defined in `src/navigation/types.ts`. Use the helper types in screens:

```tsx
import type { AuthScreenProps } from '@/navigation/types';

// For Login screen:
type Props = AuthScreenProps<'Login'>;

// Access navigation and route:
export function LoginScreen({ navigation, route }: Props) { ... }
```

### Deep Linking

Configured in `src/navigation/linking.ts`:

- URL scheme: `rncliboilerplate://`
- Web prefix: `https://rncliboilerplate.app`
- Routes: `/login`, `/register`, `/home`, `/profile`, `/settings`

### Adding a New Screen

1. Create the screen file in `src/screens/app/` or `src/screens/auth/`.
2. Add the screen name + params to the param list in `src/navigation/types.ts`.
3. Add the `<Stack.Screen>` or `<Tab.Screen>` in the appropriate navigator.
4. Add the deep link route in `src/navigation/linking.ts`.

---

## State Management (Redux)

### How It Works

- **Redux Toolkit** for state management with slices.
- **redux-persist + MMKV** for persisting the auth slice across app restarts.
- **Typed hooks** — always use `useAppSelector` and `useAppDispatch` (never plain `useSelector`/`useDispatch`).

### Reading State

```tsx
import { useAppSelector } from '@/store/hooks';

const user = useAppSelector((s) => s.auth.user);
const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
```

### Dispatching Actions

```tsx
import { useAppDispatch } from '@/store/hooks';
import { setAuthenticated, logout } from '@/store/slices/authSlice';

const dispatch = useAppDispatch();
dispatch(setAuthenticated(true));
dispatch(logout());
```

### Adding a New Slice

1. Create `src/store/slices/{feature}Slice.ts`:

```tsx
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface ItemsState {
  items: Item[];
  isLoading: boolean;
}

const initialState: ItemsState = { items: [], isLoading: false };

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    setItems(state, action: PayloadAction<Item[]>) {
      state.items = action.payload;
    },
  },
});

export const { setItems } = itemsSlice.actions;
export default itemsSlice.reducer;
```

2. Register it in `src/store/rootReducer.ts`:

```tsx
import itemsReducer from '@/store/slices/itemsSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  items: itemsReducer, // ← add here
});
```

---

## API Layer

### Two-Layer Architecture

| Layer         | File             | Purpose                                      |
| ------------- | ---------------- | -------------------------------------------- |
| `baseService` | `baseService.ts` | Axios instance, token interceptor, 401 guard |
| `apiService`  | `apiService.ts`  | Unwraps `response.data.data` automatically   |

### Using the API

```tsx
import { apiService } from '@/services/api/apiService';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import type { User } from '@/types/auth';

// GET request
const user = await apiService.get<User>(API_ENDPOINTS.USERS.PROFILE);

// POST request
const result = await apiService.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
  email: 'user@example.com',
  password: 'password123',
});

// PUT request (always PUT, never PATCH)
await apiService.put(API_ENDPOINTS.USERS.UPDATE_PROFILE, { name: 'New Name' });
```

### How Auth Tokens Work

1. On login → store token with `setToken()` from `@/lib/keychain`.
2. Every request → `baseService` interceptor reads token from keychain and attaches `Authorization: Bearer <token>`.
3. On 401 response → interceptor removes token, Redux auth state drives navigation back to login.

### Adding New Endpoints

Add them to `src/utils/constants/api.constant.ts`:

```tsx
export const API_ENDPOINTS = {
  // ...existing
  ITEMS: {
    LIST: '/items',
    DETAIL: (id: string) => `/items/${id}`,
    CREATE: '/items',
    UPDATE: (id: string) => `/items/${id}`,
    DELETE: (id: string) => `/items/${id}`,
  },
} as const;
```

---

## React Query (Server State)

### When to Use What

| Scenario          | Use                  | Why                                   |
| ----------------- | -------------------- | ------------------------------------- |
| GET data from API | React Query          | Caching, auto-refetch, loading states |
| POST/PUT/DELETE   | React Query mutation | Built-in loading/error/success states |
| Auth state, UI    | Redux                | Persisted client state                |

### Query Keys

Defined in `src/services/react-query/queryKeys.ts`. Always use the factory:

```tsx
import { queryKeys } from '@/services/react-query/queryKeys';

// Use in useQuery:
useQuery({
  queryKey: queryKeys.items.list({ page: 1 }),
  queryFn: () => apiService.get(API_ENDPOINTS.ITEMS.LIST),
});
```

### Adding a Mutation

Create `src/services/{feature}/{feature}.query.ts`:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { apiService } from '@/services/api/apiService';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { getApiErrorMessage } from '@/utils/common-functions';
import { queryKeys } from '@/services/react-query/queryKeys';

export function useCreateItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateItemRequest) => apiService.post(API_ENDPOINTS.ITEMS.CREATE, data),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Item created successfully' });
      queryClient.invalidateQueries({ queryKey: queryKeys.items.all });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to create item') });
    },
  });
}
```

---

## Forms & Validation

### How It Works

- **React Hook Form** handles form state, submission, and field registration.
- **Zod** defines validation schemas.
- **@hookform/resolvers** connects Zod to React Hook Form.

### All Schemas Live in One Place

`src/utils/validations/index.ts` — never define schemas inside components.

```tsx
// Schema naming: {action}{Entity}Schema (camelCase)
export const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

// Type naming: {Action}{Entity}FormValues (PascalCase)
export type CreateItemFormValues = z.infer<typeof createItemSchema>;
```

### Using in a Screen

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createItemSchema } from '@/utils/validations';
import type { CreateItemFormValues } from '@/utils/validations';

const {
  control,
  handleSubmit,
  formState: { errors },
} = useForm<CreateItemFormValues>({
  resolver: zodResolver(createItemSchema),
});

// In JSX:
<Controller
  control={control}
  name="title"
  render={({ field: { onChange, onBlur, value } }) => (
    <AppInput
      label="Title"
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      error={errors.title?.message}
    />
  )}
/>;
```

---

## UI Components

### AppButton

Location: `src/components/ui/Button.tsx`

A multi-variant button with loading state.

```tsx
import { AppButton } from '@/components/ui/Button';

<AppButton title="Submit" onPress={handleSubmit} />
<AppButton title="Cancel" onPress={handleCancel} variant="outline" />
<AppButton title="Delete" onPress={handleDelete} variant="destructive" />
<AppButton title="Saving..." onPress={handleSave} isLoading={true} />
```

**Variants:** `primary` (default), `secondary`, `outline`, `destructive`, `ghost`

### AppInput

Location: `src/components/ui/Input.tsx`

A text input with label, error message, and password visibility toggle.

```tsx
import { AppInput } from '@/components/ui/Input';

<AppInput label="Email" placeholder="you@example.com" error={errors.email?.message} />
<AppInput label="Password" secureTextEntry />
```

### ScreenWrapper

Location: `src/components/shared/ScreenWrapper.tsx`

Wraps screen content with SafeAreaView and optional padding.

```tsx
import { ScreenWrapper } from '@/components/shared/ScreenWrapper';

<ScreenWrapper>
  {/* Your screen content */}
</ScreenWrapper>

<ScreenWrapper withPadding={false}>
  {/* Full-width content */}
</ScreenWrapper>
```

### Toast Notifications

Always show toasts for mutations (create, update, delete):

```tsx
import Toast from 'react-native-toast-message';
import { getApiErrorMessage } from '@/utils/common-functions';

// Success
Toast.show({ type: 'success', text1: 'Item created successfully' });

// Error (with API error extraction)
Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Something went wrong') });
```

---

## Styling (NativeWind)

### How It Works

NativeWind v4 brings Tailwind CSS to React Native. Use `className` on RN components:

```tsx
<View className="flex-1 items-center justify-center bg-white px-4">
  <Text className="text-2xl font-bold text-gray-900">Hello</Text>
</View>
```

### Conditional Classes

Use `cn()` from `@/lib/utils` (merges Tailwind classes safely):

```tsx
import { cn } from '@/lib/utils';

<View className={cn('rounded-xl p-4', isActive && 'bg-primary-50', className)} />;
```

### Primary Color

The primary color is **Indigo** (`#6366F1` = `primary-500`). The full palette is in `src/constants/colors.ts`.

### Icons

Use `lucide-react-native` with `strokeWidth={1.5}`:

```tsx
import { Home, User, Settings } from 'lucide-react-native';

<Home size={24} strokeWidth={1.5} color="#6366F1" />;
```

---

## Utilities & Helpers

### Logger

Use `logger` instead of `console.log` — it's silent in production (except errors):

```tsx
import { logger } from '@/lib/logger';

logger.log('Data loaded', data);
logger.warn('Token expired');
logger.error('API failed', error);
```

### Secure Token Storage

```tsx
import { getToken, setToken, removeToken } from '@/lib/keychain';

await setToken('jwt-token-here');
const token = await getToken();
await removeToken();
```

### API Error Messages

```tsx
import { getApiErrorMessage } from '@/utils/common-functions';

// Extracts message from Axios error response, falls back to default
const msg = getApiErrorMessage(error, 'Something went wrong');
```

### Debounce Hook

```tsx
import { useDebounce } from '@/hooks';

const debouncedSearch = useDebounce(searchText, 300);
```

---

## Adding a New Feature (Step-by-Step)

Let's say you want to add a **Products** feature with a list and create form.

### Step 1: Types

Create `src/types/product.ts`:

```tsx
export interface Product {
  id: string;
  title: string;
  price: number;
  created_at: string;
}
```

### Step 2: API Endpoints

Add to `src/utils/constants/api.constant.ts`:

```tsx
PRODUCTS: {
  LIST: '/products',
  CREATE: '/products',
  DETAIL: (id: string) => `/products/${id}`,
  UPDATE: (id: string) => `/products/${id}`,
  DELETE: (id: string) => `/products/${id}`,
},
```

### Step 3: Query Keys

Add to `src/services/react-query/queryKeys.ts`:

```tsx
products: {
  all: ['products'] as const,
  list: (params?: ListParams) => [...queryKeys.products.all, 'list', params] as const,
  detail: (id: string) => [...queryKeys.products.all, 'detail', id] as const,
},
```

### Step 4: React Query Hooks

Create `src/services/products/products.query.ts`:

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { apiService } from '@/services/api/apiService';
import { API_ENDPOINTS } from '@/utils/constants/api.constant';
import { queryKeys } from '@/services/react-query/queryKeys';
import { getApiErrorMessage } from '@/utils/common-functions';

import type { Product } from '@/types/product';

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products.list(),
    queryFn: () => apiService.get<Product[]>(API_ENDPOINTS.PRODUCTS.LIST),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; price: number }) =>
      apiService.post(API_ENDPOINTS.PRODUCTS.CREATE, data),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Product created' });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
    onError: (err) => {
      Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed to create') });
    },
  });
}
```

### Step 5: Validation Schema

Add to `src/utils/validations/index.ts`:

```tsx
export const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  price: z.number().min(0, 'Price must be positive'),
});
export type CreateProductFormValues = z.infer<typeof createProductSchema>;
```

### Step 6: Screen

Create `src/screens/app/ProductsScreen.tsx` and build the UI using `AppButton`, `AppInput`, `ScreenWrapper`, etc.

### Step 7: Navigation

Add to `src/navigation/types.ts`:

```tsx
export type AppTabParamList = {
  Home: undefined;
  Products: undefined; // ← add
  Profile: undefined;
  Settings: undefined;
};
```

Add the tab in `src/navigation/AppTabs.tsx` and the deep link in `src/navigation/linking.ts`.

---

## Coding Conventions

### Imports

- Always use `@/` path alias — never relative paths like `../../`.
- Type-only imports must use `import type`:

```tsx
// Correct
import type { User } from '@/types/auth';
import { useAppSelector } from '@/store/hooks';

// Wrong — will break the build
import { User } from '@/types/auth';
```

### Exports

- **Named exports** for everything: `export function MyComponent()`.
- **Exception**: `App.tsx` uses `export default` (RN requirement).

### Naming

| Item             | Convention                       | Example                |
| ---------------- | -------------------------------- | ---------------------- |
| Screen component | PascalCase + `Screen` suffix     | `HomeScreen`           |
| Slice file       | camelCase + `Slice` suffix       | `authSlice.ts`         |
| Schema           | camelCase + `Schema` suffix      | `loginSchema`          |
| Form type        | PascalCase + `FormValues` suffix | `LoginFormValues`      |
| Constant file    | kebab-case + `.constant.ts`      | `api.constant.ts`      |
| Types file       | lowercase                        | `auth.ts`, `common.ts` |

### Rules Checklist

- No `any` — TypeScript strict mode is on
- No unused variables or imports
- `useCallback` on handlers passed as props
- `FlatList` for dynamic lists (not `ScrollView`)
- Optional chaining on all nullable access
- Toast notifications on all mutations
- `SafeAreaView` from `react-native-safe-area-context`
- `react-native-fast-image` for all images
- `logger` for all logging (not `console.log`)
- Hooks called before any early returns
- Stable unique IDs for list keys (not array index)
