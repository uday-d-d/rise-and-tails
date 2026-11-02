export type LatLng = { lat: number; lng: number };

export const SERVICE_RADIUS_KM = 25;
export const OUT_OF_RADIUS_MESSAGE =
  "Location out of 25 km service radius. Request redirected to partner shelter network.";

/** Great-circle distance between two points in kilometres (Haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isWithinRadius(center: LatLng, point: LatLng, radiusKm = SERVICE_RADIUS_KM) {
  return haversineKm(center, point) <= radiusKm;
}

export function getBrowserLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Location is not supported on this device"));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error("Could not get your location. Please type the address instead.")),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}

/** Turn a typed address into coordinates using OpenStreetMap's free geocoder. */
export async function geocodeAddress(query: string): Promise<LatLng | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;
  const first = data[0];
  if (!first) return null;
  return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
}

export function isOutOfRadiusError(err: unknown) {
  return typeof err === "object" && err !== null && "message" in err &&
    String((err as { message: string }).message).includes("OUT_OF_RADIUS");
}
