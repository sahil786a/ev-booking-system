import { Linking, Platform } from 'react-native';

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

export async function openExternalDirections(lat: number | string, lng: number | string, label?: string) {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
    throw new Error('Invalid coordinates');
  }

  const dest = `${latNum},${lngNum}`;
  const encodedLabel = label ? encodeURIComponent(label) : 'Destination';

  // Try platform native maps first
  if (Platform.OS === 'ios') {
    const appleUrl = `maps://?daddr=${dest}`;
    const googleUrl = `comgooglemaps://?daddr=${dest}`;
    if (await Linking.canOpenURL(appleUrl)) {
      return Linking.openURL(appleUrl);
    }
    if (await Linking.canOpenURL(googleUrl)) {
      return Linking.openURL(googleUrl);
    }
    // Fallback to Google Maps web
    return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=${encodedLabel}`);
  }

  // Android: try geo: then Google Maps intent URL, then web fallback
  const geoUrl = `geo:${dest}?q=${dest}(${encodedLabel})`;
  const googleMapsUrl = `google.navigation:q=${dest}`;

  if (await Linking.canOpenURL(geoUrl)) {
    return Linking.openURL(geoUrl);
  }

  if (await Linking.canOpenURL(googleMapsUrl)) {
    return Linking.openURL(googleMapsUrl);
  }

  // Web fallback
  return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${dest}`);
}

export default { openExternalDirections };
