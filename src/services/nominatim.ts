export interface GeocodeResult {
  displayName: string;
  formattedTitle: string;
  formattedSubtitle: string;
  lat: number;
  lng: number;
  type?: string;
}

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return [];

  const trimmed = query.trim();

  // Primary search prioritizing India
  const indiaUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    trimmed
  )}&countrycodes=in&limit=7&addressdetails=1`;

  try {
    const res = await fetch(indiaUrl, {
      headers: {
        'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.5',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(formatNominatimItem);
      }
    }
  } catch (err) {
    console.warn('India geocode search warning:', err);
  }

  // Fallback to global search if no India results found
  try {
    const globalUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&limit=5&addressdetails=1`;
    const res = await fetch(globalUrl, {
      headers: {
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data.map(formatNominatimItem) : [];
    }
  } catch (err) {
    console.warn('Global geocode fallback warning:', err);
  }

  return [];
}

function formatNominatimItem(item: any): GeocodeResult {
  const address = item.address || {};
  const mainPart =
    address.amenity ||
    address.railway ||
    address.building ||
    address.road ||
    address.suburb ||
    address.neighbourhood ||
    item.display_name.split(',')[0] ||
    'Location';

  const secondaryParts: string[] = [];
  if (address.suburb && address.suburb !== mainPart) secondaryParts.push(address.suburb);
  if (address.city || address.town || address.village) {
    const city = address.city || address.town || address.village;
    if (city !== mainPart) secondaryParts.push(city);
  }
  if (address.state) secondaryParts.push(address.state);
  if (address.postcode) secondaryParts.push(address.postcode);

  const subtitle = secondaryParts.length > 0 ? secondaryParts.join(', ') : item.display_name;

  return {
    displayName: item.display_name,
    formattedTitle: mainPart,
    formattedSubtitle: subtitle,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    type: item.type || item.class,
  };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en-IN,en',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const data = await res.json();
    if (!data.display_name) return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    const address = data.address || {};
    const parts = [
      address.road || address.neighbourhood || address.suburb,
      address.city || address.town || address.village,
      address.state,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : data.display_name;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}
