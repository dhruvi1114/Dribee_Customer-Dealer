# RNBoilerplate — React Native CLI Boilerplate

A production-ready React Native CLI boilerplate with TypeScript, Redux, React Query, NativeWind (Tailwind CSS), Firebase, and more.

## Tech Stack

| Category | Library | Version |
|----------|---------|---------|
| Framework | React Native (CLI) | 0.76.5 |
| Language | TypeScript | 5.0.4 |
| Navigation | React Navigation v7 | 7.x |
| State Management | Redux Toolkit + redux-persist | 2.x |
| Server State | TanStack React Query | 5.x |
| Styling | NativeWind (Tailwind CSS) | 4.2 |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| HTTP Client | Axios | 1.x |
| Storage | MMKV (fast) + Keychain (secure) | 3.x / 10.x |
| Firebase | Analytics, Crashlytics, Messaging | 23.x |
| Animations | Reanimated + Gesture Handler | 3.x / 2.x |
| UI Components | Lucide Icons, Bottom Sheet, Toast | — |

## Prerequisites

- **Node.js** >= 18
- **Ruby** >= 2.6.10 (for CocoaPods)
- **Xcode** (for iOS development)
- **Android Studio** (for Android development)
- **CocoaPods** (`gem install cocoapods`)

> For detailed installation of all prerequisites, see [INSTALLATION.md](INSTALLATION.md).

## Quick Start

### 1. Clone and install dependencies

```bash
git clone <your-repo-url> MyApp
cd MyApp
npm install
```

### 2. Rename the app (replace "RNBoilerplate" with your app name)

See the [Renaming the App](#renaming-the-app) section below.

### 3. Set up environment variables

```bash
cp .env.example .env
cp .env.example .env.local
cp .env.example .env.development
cp .env.example .env.production
```

Update each file with the correct values:

| File | `APP_ENV` | `API_BASE_URL` |
|------|-----------|----------------|
| `.env` | `local` | Local server URL |
| `.env.local` | `local` | Local server URL |
| `.env.development` | `development` | Development server URL |
| `.env.production` | `production` | Production server URL |

### 4. Set up Firebase

Get your Firebase config files from the [Firebase Console](https://console.firebase.google.com/) and place them:

- **iOS**: `ios/RNBoilerplate/GoogleService-Info.plist`
- **Android**: `android/app/google-services.json`

> See `.example` versions of these files for the expected format.

### 5. Install iOS dependencies and run

```bash
npm run pods          # Install CocoaPods
npm run ios:dev       # Run on iOS simulator
npm run android:dev   # Run on Android emulator
```

## Renaming the App

To rename "RNBoilerplate" to your own app name (e.g., "MyApp"), update these files:

### App Config
- `app.json` — change `name` and `displayName`
- `package.json` — change `name`

### iOS
- `ios/RNBoilerplate/AppDelegate.mm` — change `moduleName`
- `ios/RNBoilerplate/Info.plist` — change `CFBundleDisplayName`
- `ios/RNBoilerplate/LaunchScreen.storyboard` — change displayed text
- `ios/RNBoilerplate.xcodeproj/project.pbxproj` — change `PRODUCT_BUNDLE_IDENTIFIER` and `PRODUCT_NAME`
- `ios/Podfile` — change target name
- Rename directories: `ios/RNBoilerplate/` → `ios/MyApp/`
- Rename: `ios/RNBoilerplate.xcodeproj/` → `ios/MyApp.xcodeproj/`
- Rename: `ios/RNBoilerplate.xcworkspace/` → `ios/MyApp.xcworkspace/`
- Update `ios/MyApp.xcworkspace/contents.xcworkspacedata` with new project name
- Rename scheme: `ios/MyApp.xcodeproj/xcshareddata/xcschemes/RNBoilerplate.xcscheme` → `MyApp.xcscheme`

### Android
- `android/settings.gradle` — change `rootProject.name`
- `android/app/build.gradle` — change `namespace` and `applicationId`
- `android/app/src/main/java/com/rnboilerplate/MainActivity.kt` — change `package` and `getMainComponentName()`
- `android/app/src/main/java/com/rnboilerplate/MainApplication.kt` — change `package`
- Move Kotlin files to match your new package: `com/rnboilerplate/` → `com/yourpackage/`

### Source Code
- `src/navigation/linking.ts` — update deep link prefixes
- `scripts/generate-app-icon.js` — update iOS icon set path

## Project Structure

```
src/
├── components/
│   ├── ui/                # Base components (Button, Input)
│   ├── shared/            # Reusable (ErrorBoundary, Toast, ScreenWrapper, EnvBadge)
│   └── layout/            # Layout components
├── screens/
│   ├── auth/              # LoginScreen, RegisterScreen
│   └── app/               # HomeScreen, ProfileScreen, SettingsScreen
├── navigation/            # React Navigation setup (AppNavigator, AuthStack, AppTabs)
├── store/                 # Redux store + slices (authSlice)
├── services/
│   ├── api/               # Axios baseService + apiService wrapper
│   └── react-query/       # QueryClient + query key factory
├── lib/                   # Utilities (keychain, logger, mmkv, cn)
├── providers/             # AppProviders (Redux, React Query, SafeArea, Toast)
├── config/                # Environment config (env.ts)
├── types/                 # TypeScript types (auth, common, navigation)
├── constants/             # Colors, app constants
├── utils/
│   ├── constants/         # API endpoints, storage keys
│   ├── validations/       # Zod schemas
│   └── common-functions/  # Utility functions
└── hooks/                 # Custom hooks (useDebounce)
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Metro bundler (default env) |
| `npm run start:local` | Start Metro with local env |
| `npm run start:dev` | Start Metro with development env |
| `npm run start:prod` | Start Metro with production env |
| `npm run start:clean` | Start Metro with cleared cache |
| `npm run ios` | Run on iOS (default env) |
| `npm run ios:local` | Run on iOS with local env |
| `npm run ios:dev` | Run on iOS with development env |
| `npm run ios:prod` | Run on iOS with production env |
| `npm run android` | Run on Android (default env) |
| `npm run android:local` | Run on Android with local env |
| `npm run android:dev` | Run on Android with development env |
| `npm run android:prod` | Run on Android with production env |
| `npm run build` | TypeScript type check |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run pods` | Install iOS CocoaPods |

> When switching environments, always use env-specific scripts — they clear the Metro cache automatically.

## Key Features

- **Authentication Flow** — Login/Register screens with Redux state, secure token storage via Keychain
- **Type-Safe Navigation** — React Navigation v7 with full TypeScript support (Stack + Bottom Tabs)
- **API Layer** — Axios with request/response interceptors, automatic token attachment, 401 handling
- **Server State Caching** — React Query with query key factory pattern
- **Form Validation** — React Hook Form + Zod schemas with reusable field validators
- **Secure Storage** — Keychain for auth tokens, MMKV for fast app data + Redux persistence
- **Environment Management** — Multi-environment support (local/dev/prod) with dotenv
- **Error Handling** — ErrorBoundary component + API error message extraction
- **UI Components** — AppButton (5 variants), AppInput (with password toggle), ScreenWrapper, Toast
- **Styling** — NativeWind (Tailwind CSS) with custom color palette and Inter font family
- **Firebase** — Analytics, Crashlytics, and Push Notifications pre-configured
- **Deep Linking** — Configurable URL scheme and universal links
- **Developer Tools** — Draggable EnvBadge (dev only), structured logger, app icon generator script

## Documentation

- [INSTALLATION.md](INSTALLATION.md) — Detailed prerequisites and setup for macOS/Windows
- [PROJECT_GUIDE.md](PROJECT_GUIDE.md) — Architecture, patterns, and step-by-step feature addition guide
- [CLAUDE.md](CLAUDE.md) — AI-assisted development rules and conventions
