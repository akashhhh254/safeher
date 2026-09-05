export interface GeocodeResult {
  displayName: string;
  lat: number;
  lng: number;
}

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return [];
    const data = await res.json();

    return data.map((item: any) => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (err) {
    console.warn('Address search error:', err);
    return [];
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
