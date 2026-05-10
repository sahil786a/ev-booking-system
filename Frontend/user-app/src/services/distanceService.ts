/** Haversine distance in kilometers; latitude/longitude in decimal degrees */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function sortByNearest<T extends { lat?: number | null; lng?: number | null }>(
  items: T[],
  coords: { latitude: number; longitude: number },
): Array<T & { distanceKm?: number }> {
  return items
    .map((item) => {
      const lat = item.lat;
      const lng = item.lng;
      if (lat == null || lng == null) return { ...item, distanceKm: undefined };
      const d = distanceKm(coords.latitude, coords.longitude, lat, lng);
      return { ...item, distanceKm: d };
    })
    .sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}
