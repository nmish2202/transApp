import {Platform} from 'react-native';
import {
  check,
  PERMISSIONS,
  request,
  RESULTS,
  type Permission
} from 'react-native-permissions';
import type {PermissionStatusValue} from '@app-types/speech';

function mapStatus(status: string): PermissionStatusValue {
  switch (status) {
    case RESULTS.GRANTED:
      return 'granted';
    case RESULTS.DENIED:
      return 'denied';
    case RESULTS.BLOCKED:
      return 'blocked';
    case RESULTS.UNAVAILABLE:
      return 'unavailable';
    default:
      return 'unknown';
  }
}

function getMicrophonePermission(): Permission {
  return Platform.select({
    android: PERMISSIONS.ANDROID.RECORD_AUDIO,
    ios: PERMISSIONS.IOS.MICROPHONE,
    default: PERMISSIONS.ANDROID.RECORD_AUDIO
  }) as Permission;
}

export function useMicrophonePermission() {
  const permission = getMicrophonePermission();

  return {
    async checkPermission(): Promise<PermissionStatusValue> {
      return mapStatus(await check(permission));
    },
    async requestPermission(): Promise<PermissionStatusValue> {
      return mapStatus(await request(permission));
    }
  };
}