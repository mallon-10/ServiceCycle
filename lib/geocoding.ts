/**
 * Best-effort geocoding via Nominatim (OpenStreetMap) — free, no API key.
 * Usage policy caps at ~1 req/s and requires a descriptive User-Agent; this
 * runs once per customer create/update, not on page load, so it stays well
 * within that. Never throws — a failed/ambiguous address just means the
 * customer won't show on the operations map, it doesn't block the save.
 */
export async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  if (!address.trim()) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "ServiceCycle/1.0 (asset lifecycle management)",
      },
    });

    if (!response.ok) return null;

    const results = (await response.json()) as { lat: string; lon: string }[];
    const first = results[0];
    if (!first) return null;

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return { latitude, longitude };
  } catch {
    return null;
  }
}
