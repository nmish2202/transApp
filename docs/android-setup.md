# Android Setup

## Requirements

- Android Studio with SDK and emulator
- Java 17
- Android SDK platform matching the React Native `0.82.x` template you generate

## Required permission

Add this to `android/app/src/main/AndroidManifest.xml` inside the `<manifest>` element:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

If you expect long-running capture while backgrounded, also evaluate foreground service requirements for your target Android version.

## Native modules to link

After generating the Android shell project, run:

```bash
npm install
npx pod-install
```

Autolinking should handle:

- `react-native-audio-record`
- `react-native-mmkv`
- `react-native-permissions`
- `react-native-fs`
- `react-native-share`
- `react-native-html-to-pdf`

## Permissions module note

If `react-native-permissions` requires extra manifest setup in the template you generate, follow the package README for the Android permission handler configuration.

## Run

```bash
npm run android
```