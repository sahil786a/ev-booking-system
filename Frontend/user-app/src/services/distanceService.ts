/** Haversine distance in kilometers; latitude/longitude in decimal degrees */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Ensure all inputs are numbers (handles string coordinates from API)
  const lat1Num = Number(lat1);
  const lon1Num = Number(lon1);
  const lat2Num = Number(lat2);
  const lon2Num = Number(lon2);
  
  // Validate that all are finite numbers
  if (!Number.isFinite(lat1Num) || !Number.isFinite(lon1Num) || 
      !Number.isFinite(lat2Num) || !Number.isFinite(lon2Num)) {
    console.warn('[distanceKm] Invalid coordinates:', { lat1Num, lon1Num, lat2Num, lon2Num });
    return 0;
  }
  
  // Validate latitude range
  if (lat1Num < -90 || lat1Num > 90 || lat2Num < -90 || lat2Num > 90) {
    console.warn('[distanceKm] Latitude out of range:', { lat1Num, lat2Num });
    return 0;
  }
  
  // Validate longitude range
  if (lon1Num < -180 || lon1Num > 180 || lon2Num < -180 || lon2Num > 180) {
    console.warn('[distanceKm] Longitude out of range:', { lon1Num, lon2Num });
    return 0;
  }
  
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2Num - lat1Num);
  const dLon = toRad(lon2Num - lon1Num);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1Num)) * Math.cos(toRad(lat2Num)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
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
