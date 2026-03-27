# iOS Setup

## Requirements

- Xcode 16 or newer
- CocoaPods
- iOS simulator or physical device

## Required Info.plist entry

Add this key to `ios/YourApp/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>TransApp needs microphone access to capture Nepali conversations and translate them into Hindi.</string>
```

## Install pods

After generating the iOS shell project, run:

```bash
npm install
npx pod-install
```

## Optional permission handler setup

Depending on the generated React Native template and `react-native-permissions` version, add the microphone permission pod entry described in that library's installation guide.

## Run

```bash
npm run ios
```

## Export behavior

PDF export and file sharing work on iOS through `react-native-html-to-pdf`, `react-native-fs`, and `react-native-share`. Verify share-sheet availability on a real device if email or WhatsApp is part of your release path.