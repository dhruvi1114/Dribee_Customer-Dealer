# Installation Guide

This guide covers everything you need to set up your development environment for this React Native CLI project on **macOS** and **Windows**.

---

## Prerequisites Overview

| Tool           | Version          | macOS | Windows |
| -------------- | ---------------- | ----- | ------- |
| Node.js        | >= 18 (LTS)      | Yes   | Yes     |
| npm            | Comes with Node  | Yes   | Yes     |
| Watchman       | Latest           | Yes   | No      |
| Ruby           | >= 2.6.10        | Yes   | No      |
| CocoaPods      | >= 1.13          | Yes   | No      |
| Xcode          | 16+ (or 26 beta) | Yes   | No      |
| Android Studio | Latest           | Yes   | Yes     |
| JDK            | 17               | Yes   | Yes     |
| Git            | Latest           | Yes   | Yes     |

---

## macOS Setup

### 1. Install Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Install Node.js (>= 18)

```bash
brew install node
```

Or use nvm for version management:

```bash
brew install nvm
nvm install 18
nvm use 18
```

Verify:

```bash
node --version   # Should be >= 18
npm --version
```

### 3. Install Watchman

```bash
brew install watchman
```

### 4. Install Ruby (>= 2.6.10)

macOS comes with Ruby, but it's recommended to use a version manager:

```bash
brew install rbenv ruby-build
rbenv install 3.1.0
rbenv global 3.1.0
```

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
eval "$(rbenv init -)"
```

Restart your terminal, then verify:

```bash
ruby --version
```

### 5. Install CocoaPods

```bash
gem install cocoapods
```

Verify:

```bash
pod --version   # Should be >= 1.13
```

### 6. Install Xcode

1. Download **Xcode** from the Mac App Store.
2. Open Xcode and accept the license agreement.
3. Install Command Line Tools:

```bash
xcode-select --install
```

4. Open Xcode > Settings > Platforms and ensure **iOS Simulator** is installed.

### 7. Install Android Studio

1. Download Android Studio from https://developer.android.com/studio.
2. During installation, make sure the following are checked:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)
3. Open Android Studio > Settings > SDK Manager and install:
   - **Android 14 (API 34)** — SDK Platform
   - **Android 15 (API 35)** — SDK Platform (for compile SDK)
   - **Android SDK Build-Tools 35.0.0**
   - **NDK 26.1.10909125** (from SDK Tools tab)
   - **Android SDK Command-line Tools**
   - **CMake** (from SDK Tools tab)

### 8. Install JDK 17

```bash
brew install --cask zulu@17
```

### 9. Set Environment Variables

Add the following to `~/.zshrc` (or `~/.bashrc`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

Apply changes:

```bash
source ~/.zshrc
```

### 10. Create an Android Emulator

1. Open Android Studio > Virtual Device Manager.
2. Create a new device (e.g., Pixel 7) with **API 34** system image.

---

## Windows Setup

> **Note:** iOS development is **not possible** on Windows. You can only build and run the Android version.

### 1. Install Chocolatey (Package Manager)

Open PowerShell as Administrator and run:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 2. Install Node.js (>= 18) and JDK 17

```powershell
choco install -y nodejs-lts microsoft-openjdk17
```

Verify:

```powershell
node --version   # Should be >= 18
npm --version
java -version    # Should be 17.x
```

### 3. Install Android Studio

1. Download Android Studio from https://developer.android.com/studio.
2. During installation, make sure the following are checked:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)
3. Open Android Studio > Settings > SDK Manager and install:
   - **Android 14 (API 34)** — SDK Platform
   - **Android 15 (API 35)** — SDK Platform (for compile SDK)
   - **Android SDK Build-Tools 35.0.0**
   - **NDK 26.1.10909125** (from SDK Tools tab)
   - **Android SDK Command-line Tools**
   - **CMake** (from SDK Tools tab)

### 4. Set Environment Variables

1. Open **System Properties** > **Environment Variables**.
2. Add a new **User variable**:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
3. Edit the **Path** variable and add these entries:
   - `%ANDROID_HOME%\emulator`
   - `%ANDROID_HOME%\platform-tools`
4. Add another **User variable**:
   - Variable name: `JAVA_HOME`
   - Variable value: `C:\Program Files\Microsoft\jdk-17` (or wherever JDK 17 was installed)

Verify in a new terminal:

```powershell
adb --version
echo %ANDROID_HOME%
```

### 5. Create an Android Emulator

1. Open Android Studio > Virtual Device Manager.
2. Create a new device (e.g., Pixel 7) with **API 34** system image.

### 6. Install Git

```powershell
choco install -y git
```

---

## Project Setup (Both Platforms)

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd rn-cli-boilerplate
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set your API base URL:

```
API_BASE_URL=https://your-api-url.com/v1
```

### 3. Set Up Firebase (Optional)

For iOS:

1. Create a Firebase project at https://console.firebase.google.com.
2. Download `GoogleService-Info.plist` and replace the placeholder file at `ios/RNBoilerplate/GoogleService-Info.plist`.

For Android:

1. Download `google-services.json` and place it at `android/app/google-services.json`.

> The project includes placeholder Firebase config files so it builds without real Firebase credentials. Firebase features won't work until you add your own config files.

### 4. iOS Setup (macOS Only)

```bash
cd ios
pod install
cd ..
```

### 5. Run the App

**iOS (macOS only):**

```bash
# Start Metro bundler (Terminal 1)
npm run start:clean

# Run on iOS simulator (Terminal 2)
npm run ios
```

**Android (macOS and Windows):**

```bash
# Start Metro bundler (Terminal 1)
npm run start:clean

# Run on Android emulator (Terminal 2)
npm run android
```

---

## Verify Your Setup

Run the React Native doctor to check your environment:

```bash
npx react-native doctor
```

This will show you if anything is missing or misconfigured.

---

## Available Scripts

| Command               | Description                       |
| --------------------- | --------------------------------- |
| `npm run start`       | Start Metro bundler               |
| `npm run start:clean` | Start Metro with cache cleared    |
| `npm run ios`         | Build and run on iOS simulator    |
| `npm run android`     | Build and run on Android emulator |
| `npm run build`       | TypeScript type-check (`tsc`)     |
| `npm run lint`        | Run ESLint                        |
| `npm run test`        | Run Jest tests                    |
| `npm run pods`        | Install CocoaPods dependencies    |

---

## Troubleshooting

### Metro bundler not connecting

Make sure Metro is running (`npm run start:clean`) before launching the app. If it fails with `EADDRINUSE`, kill the existing process:

```bash
# macOS/Linux
lsof -ti:8081 | xargs kill -9

# Windows
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### iOS build fails with `CLANG_WARN_DOCUMENTATION_COMMENTS` / xcodebuild error code 65

This is the most common iOS build error. It looks like:

```
error export CLANG_WARN_DOCUMENTATION_COMMENTS=YES
error export CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER=NO
error export GCC_WARN_UNDECLARED_SELECTOR=YES
...
error Failed to build ios project. "xcodebuild" exited with error code '65'.
```

**Cause:** Stale build cache or corrupted Pods. This typically happens after updating Xcode, switching branches, or after a failed build.

**Fix — run these commands in order:**

```bash
# Step 1: Kill Metro if running
lsof -ti:8081 | xargs kill -9 2>/dev/null

# Step 2: Clean everything
cd ios
rm -rf Pods Podfile.lock build
rm -rf ~/Library/Developer/Xcode/DerivedData

# Step 3: Reinstall pods
pod install

# Step 4: Go back and run
cd ..
npm run start:clean   # Terminal 1
npm run ios           # Terminal 2
```

If the error persists after cleaning, open the full build log in Xcode for more details:

```bash
open ios/RNBoilerplate.xcworkspace
```

Then build with **Cmd+B** in Xcode to see the actual error.

### iOS build fails with `Redefinition of module 'ReactCommon'`

This error looks like:

```
error: Redefinition of module 'ReactCommon'
error: Could not build module '_Builtin_stdbool'
error: Could not build module 'UIKit'
```

**Cause:** The `use_modular_headers!` global flag in the Podfile conflicts with newer Xcode versions (Xcode 16+). This project already has the fix applied — modular headers are enabled only for specific Firebase dependencies instead of globally.

If you encounter this error (e.g., after modifying the Podfile), make sure your `ios/Podfile` does **NOT** have `use_modular_headers!` globally. Instead, it should have targeted modular headers:

```ruby
# Correct — targeted modular headers for Firebase deps only
pod 'GoogleUtilities', :modular_headers => true
pod 'GoogleDataTransport', :modular_headers => true
pod 'nanopb', :modular_headers => true
pod 'FirebaseCore', :modular_headers => true
pod 'FirebaseCoreExtension', :modular_headers => true
pod 'FirebaseCoreInternal', :modular_headers => true
pod 'FirebaseInstallations', :modular_headers => true
```

Then clean and rebuild:

```bash
cd ios
rm -rf Pods Podfile.lock build
rm -rf ~/Library/Developer/Xcode/DerivedData
pod install
cd ..
npm run ios
```

### iOS build fails with `Could not get GOOGLE_APP_ID`

```
error: Could not get GOOGLE_APP_ID in Google Services file from build environment
```

**Cause:** The `GoogleService-Info.plist` is missing or not added to the Xcode project.

**Fix:** Download your `GoogleService-Info.plist` from the [Firebase Console](https://console.firebase.google.com) and replace the placeholder at `ios/RNBoilerplate/GoogleService-Info.plist`. Make sure it's added to the Xcode project (it should already be included).

### iOS build fails with other module errors

Clean the build and reinstall pods:

```bash
cd ios
rm -rf Pods Podfile.lock build
pod install
cd ..
rm -rf ~/Library/Developer/Xcode/DerivedData
npm run ios
```

### Android build fails

Clean the Android build:

```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS build fails due to spaces in folder path

If your project folder path contains spaces (e.g., `/Users/john/My Projects/MyApp`), the iOS build may fail with shell script errors during the CocoaPods build phase.

**Fix:** This boilerplate includes a patch (`patches/react-native+0.76.5.patch`) that fixes this issue automatically. The patch is applied when you run `npm install` via `patch-package`. If the issue persists:

```bash
# Reapply patches
npx patch-package

# Clean and rebuild
cd ios
rm -rf Pods Podfile.lock build
pod install
cd ..
npm run ios
```

> **Note:** The patch wraps shell script paths in quotes so they work correctly with spaces. This is a known React Native issue.

### General cache issues

Reset all caches:

```bash
# Clear watchman
watchman watch-del-all

# Clear Metro cache
npm run start:clean

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```
