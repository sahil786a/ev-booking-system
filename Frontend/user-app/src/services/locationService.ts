import * as Location from 'expo-location';

export type GeoPosition = {
  latitude: number;
  longitude: number;
  accuracyM?: number | null;
};

async function resolvePermission(): Promise<Location.PermissionResponse> {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.granted) return existing;
  return Location.requestForegroundPermissionsAsync();
}

export async function ensureForegroundPermission(): Promise<GeoPosition | null> {
  const res = await resolvePermission();
  if (!res.granted) return null;

  try {
    // Use HIGH accuracy for better distance calculations
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
      distanceInterval: 0,
    });
    return {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracyM: pos.coords.accuracy,
    };
  } catch {
    return null;
  }
}

export async function getPermissionStatus(): Promise<Location.PermissionStatus> {
  const res = await Location.getForegroundPermissionsAsync();
  return res.status;
}
