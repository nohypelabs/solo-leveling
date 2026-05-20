import { Alert, Platform, Linking } from 'react-native';
import * as Camera from 'expo-camera';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { isIRAvailable } from './IRBlasterService';

export interface PermissionStatus {
  camera: boolean;
  location: boolean;
  backgroundLocation: boolean;
  notifications: boolean;
  ir: boolean;
}

const RATIONALE = {
  camera: {
    title: 'Camera Access',
    message: 'Solo Leveling needs camera access for AI pose detection during training. The system watches your form and counts reps automatically.',
  },
  location: {
    title: 'Location Access',
    message: 'Solo Leveling tracks your location for bonus outdoor missions like Shadow Walk and Speed Dash.',
  },
  backgroundLocation: {
    title: 'Background Location',
    message: 'For activity-based bonus missions, Solo Leveling needs to track movement in the background.',
  },
  notifications: {
    title: 'Notifications',
    message: 'Solo Leveling sends daily mission reminders and level-up alerts.',
  },
};

async function requestWithRationale(
  rationale: { title: string; message: string },
  requestFn: () => Promise<boolean>,
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      rationale.title,
      rationale.message,
      [
        { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Allow',
          onPress: async () => {
            const result = await requestFn();
            resolve(result);
          },
        },
      ],
    );
  });
}

export async function requestCameraPermission(): Promise<boolean> {
  return requestWithRationale(RATIONALE.camera, async () => {
    const { status } = await Camera.useCameraPermissions();
    if (status === 'granted') return true;
    const result = await Camera.useCameraPermissions();
    return result.granted;
  });
}

export async function requestLocationPermission(): Promise<boolean> {
  return requestWithRationale(RATIONALE.location, async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  });
}

export async function requestBackgroundLocationPermission(): Promise<boolean> {
  return requestWithRationale(RATIONALE.backgroundLocation, async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    return status === 'granted';
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  return requestWithRationale(RATIONALE.notifications, async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  });
}

export async function getAllPermissions(): Promise<PermissionStatus> {
  const cameraPerm = await Camera.useCameraPermissions();
  const locationPerm = await Location.getForegroundPermissionsAsync();
  const bgLocationPerm = await Location.getBackgroundPermissionsAsync();
  const notifPerm = await Notifications.getPermissionsAsync();

  return {
    camera: cameraPerm?.granted ?? false,
    location: locationPerm.granted,
    backgroundLocation: bgLocationPerm.granted,
    notifications: notifPerm.granted,
    ir: Platform.OS === 'android' && isIRAvailable(),
  };
}

export function openAppSettings() {
  Linking.openSettings();
}

export async function requestAllPermissions(): Promise<PermissionStatus> {
  // Camera
  const camResult = await Camera.useCameraPermissions();
  if (!camResult?.granted) {
    await Camera.useCameraPermissions();
  }

  // Location
  await Location.requestForegroundPermissionsAsync();

  // Background location (only if foreground granted)
  try {
    await Location.requestBackgroundPermissionsAsync();
  } catch {
    // Some platforms don't support background location
  }

  // Notifications
  await Notifications.requestPermissionsAsync();

  return getAllPermissions();
}
