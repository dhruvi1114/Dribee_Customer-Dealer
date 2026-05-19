# RN CLI Boilerplate — Coding Rules

> These rules are mandatory for all development — human or AI. Every file you create or modify must follow these patterns exactly.

## Quick Reference

```bash
npm run android       # Run on Android
npm run ios           # Run on iOS
npm run start         # Start Metro bundler
npm run start:clean   # Metro with cache cleared
npm run build         # TypeScript type-check (tsc --noEmit)
npm run lint          # ESLint
npm run test          # Jest test runner
```

## Tech Stack

- React Native 0.76 + TypeScript 5
- React Navigation v7 (native stack + bottom tabs)
- NativeWind v4 (Tailwind CSS for React Native)
- Redux Toolkit + redux-persist + MMKV (state)
- React Query v5 (mutations + server cache)
- React Hook Form + Zod (forms)
- Axios (HTTP) + react-native-keychain (tokens)
- Lucide React Native + @expo/vector-icons (icons)
- React Native Reanimated + Gesture Handler (animations/gestures)
- React Native Toast Message (notifications)
- @gorhom/bottom-sheet (bottom sheets)
- date-fns (date utilities)
- react-native-fast-image (optimized images)
- @react-native-firebase (messaging, analytics, crashlytics)

---

## 1. Directory Structure

```
src/
├── components/
│   ├── ui/                 # Base primitives: Button, Input
│   ├── shared/             # Reusable: EmptyState, Toast, ScreenWrapper
│   └── layout/             # Screen wrappers
├── constants/              # Color constants
├── hooks/                  # Custom hooks: useDebounce
├── lib/                    # cn(), logger, mmkv, keychain
├── navigation/             # React Navigation setup
│   ├── types.ts            # Type-safe param lists
│   ├── AuthStack.tsx       # Auth screens
│   ├── AppTabs.tsx         # Bottom tab navigator
│   ├── AppNavigator.tsx    # Root navigator + auth guard
│   └── linking.ts          # Deep linking config
├── providers/              # AppProviders (Redux, Query, etc.)
├── screens/
│   ├── auth/               # Login, Register
│   └── app/                # Home, Profile, Settings
├── services/
│   ├── api/                # baseService (Axios), apiService (unwrapper)
│   └── react-query/        # queryClient, queryKeys
├── store/
│   ├── hooks.ts            # useAppSelector, useAppDispatch (typed)
│   ├── rootReducer.ts      # combineReducers registration
│   ├── storeSetup.ts       # configureStore + MMKV persist
│   └── slices/             # Redux slices per feature
├── styles/                 # Theme definitions
├── types/                  # TypeScript definitions per domain
└── utils/
    ├── constants/          # api.constant.ts, master.constant.ts, app.constant.ts
    ├── common-functions/   # getApiErrorMessage, date helpers
    └── validations/        # Centralized Zod schemas + helpers
```

---

## 2. TypeScript Rules

### Imports
- **Path alias**: Always use `@/` for all `src/` imports. Never use relative paths like `../../`.
- **verbatimModuleSyntax is ON**: Type-only imports MUST use `import type` syntax.

```typescript
// CORRECT
import type { User } from '@/types/auth';
import { useAppSelector } from '@/store/hooks';

// WRONG — build will fail
import { User } from '@/types/auth';
```

### Strict Mode
- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true` are enforced.

---

## 3. Component Rules

### Exports
- **Named exports** for all components: `export function MyComponent()`.
- **Exception**: App.tsx uses `export default` (required by RN entry point).

### Screen Components
- Screens live in `src/screens/{auth,app}/`.
- Screen component names: PascalCase with `Screen` suffix: `HomeScreen`, `LoginScreen`.

### Icons
- Use `lucide-react-native` as primary icon library.
- Always set `strokeWidth={1.5}`.

### Styling (NativeWind)
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes.
- Primary color: Indigo (`#6366F1` / `primary-500`).

---

## 4. State Management

### Redux
- Every feature gets a slice at `src/store/slices/{feature}Slice.ts`.
- Always use `useAppSelector` / `useAppDispatch` from `src/store/hooks.ts`.
- GET APIs: `createAsyncThunk` → `extraReducers`.
- Register every new slice in `src/store/rootReducer.ts`.
- Auth slice is persisted via MMKV.

### React Query
- Mutations in `src/services/{feature}/{feature}.query.ts`.
- Always add toast notifications on success/error.

---

## 5. API Layer

- `baseService.ts` — Axios instance + keychain token interceptor + 401 handler.
- `apiService.ts` — Wrapper that auto-unwraps `response.data.data`.
- Always use **PUT** for updates, never PATCH.
- Use `API_ENDPOINTS` from `src/utils/constants/api.constant.ts`.

---

## 6. Navigation

- React Navigation v7 with type-safe navigation.
- Auth guard in `AppNavigator.tsx` — shows AuthStack or AppTabs based on Redux auth state.
- Deep linking configured in `src/navigation/linking.ts`.
- All param lists defined in `src/navigation/types.ts`.

---

## 7. Form Validation

- ALL Zod schemas live in `src/utils/validations/index.ts`. NEVER define schemas in components.
- Schema naming: `{action}{Entity}Schema` (camelCase).
- Type naming: `{Action}{Entity}FormValues` (PascalCase).

---

## 8. Toast Notifications

Always add toasts for: create, update, delete, status change — any mutation.

```typescript
import Toast from 'react-native-toast-message';
import { getApiErrorMessage } from '@/utils/common-functions';

Toast.show({ type: 'success', text1: 'Item created successfully' });
Toast.show({ type: 'error', text1: getApiErrorMessage(err, 'Failed') });
```

---

## 9. Key Rules Checklist

- [ ] TypeScript strict: no `any`, no unused vars/imports
- [ ] All type-only imports use `import type`
- [ ] `@/` path alias for all imports
- [ ] useCallback on handlers passed as props
- [ ] FlatList (not ScrollView) for dynamic lists
- [ ] Optional chaining on all nullable access
- [ ] Toast notifications on all mutations
- [ ] Zod schema in centralized validations file
- [ ] SafeAreaView from react-native-safe-area-context
- [ ] react-native-fast-image for all images
- [ ] logger (not console.log) for all logging
- [ ] Hooks called before any early returns
- [ ] Stable unique IDs for keys (not array index)
