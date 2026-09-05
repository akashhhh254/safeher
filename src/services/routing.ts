import { RouteAlternative, CommunityReport, RouteMode } from '../types';
import { calculateRouteSafety } from './safetyScoring';

/**
 * Calls public Open Source Routing Machine (OSRM) to retrieve real routes.
 * Strictly uses real road and street geometry. No fake synthetic coordinates.
 */
export async function fetchRoutesFromOSRM(
  origin: [number, number],
  destination: [number, number],
  reports: CommunityReport[]
): Promise<RouteAlternative[]> {
  const [origLat, origLng] = origin;
  const [destLat, destLng] = destination;

  // Try walking route first
  let routesData: any[] = [];
  let profileUsed = 'walking';

  const walkingUrl = `https://router.project-osrm.org/route/v1/walking/${origLng},${origLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true&steps=true`;

  try {
    const res = await fetch(walkingUrl, { signal: AbortSignal.timeout(7000) });
    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
        routesData = data.routes;
      }
    }
  } catch (err: any) {
    console.warn('Walking route query failed, trying driving network:', err?.message || err);
  }

  // If walking route returned no routes (e.g., long intercity distance or restricted pedestrian paths), query driving road network
  if (routesData.length === 0) {
    profileUsed = 'driving';
    const drivingUrl = `https://router.project-osrm.org/route/v1/driving/${origLng},${origLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true&steps=true`;
    try {
      const res = await fetch(drivingUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        if (data.code === 'Ok' && Array.isArray(data.routes) && data.routes.length > 0) {
          routesData = data.routes;
        }
      }
    } catch (err: any) {
      console.warn('Driving route query also failed:', err?.message || err);
    }
  }

  if (routesData.length === 0) {
    throw new Error(
      'No road or walking route could be found between these locations on the map network. Please check destination accessibility.'
    );
  }

  return routesData.map((r: any, idx: number) => {
    // OSRM coordinates are [lng, lat] -> Leaflet requires [lat, lng]
    const geometry: [number, number][] = r.geometry.coordinates.map(
      (c: [number, number]) => [c[1], c[0]]
    );

    const distanceKm = Math.round((r.distance / 1000) * 10) / 10;
    const durationMinutes = Math.max(1, Math.round(r.duration / 60));

    // Extract road names from actual steps
    const stepNames: string[] = [];
    if (r.legs && r.legs[0]?.steps) {
      for (const step of r.legs[0].steps) {
        if (step.name && !stepNames.includes(step.name) && step.name.trim().length > 0) {
          stepNames.push(step.name);
          if (stepNames.length >= 2) break;
        }
      }
    }

    let name = `Route ${String.fromCharCode(65 + idx)}`;
    if (stepNames.length > 0) {
      name = `Route ${String.fromCharCode(65 + idx)}: via ${stepNames.join(', ')}`;
    } else if (idx === 0) {
      name = `Route A: Primary Corridor`;
    } else {
      name = `Route ${String.fromCharCode(65 + idx)}: Alternative Road`;
    }

    const safety = calculateRouteSafety(geometry, reports, {
      isMainArtery: idx === 0,
      profile: profileUsed,
    });

    return {
      id: `route-${idx}-${Date.now()}`,
      name,
      summary: `${durationMinutes} min • ${distanceKm} km (${profileUsed === 'walking' ? 'Walking' : 'Road'})`,
      distanceKm,
      durationMinutes,
      geometry,
      safety,
      isRecommended: false,
    };
  });
}

/**
 * Sorts and marks recommendations based on user mode
 */
export function rankRoutesForMode(routes: RouteAlternative[], mode: RouteMode): RouteAlternative[] {
  if (!routes || routes.length === 0) return [];

  const scored = routes.map((r) => {
    let modeScore = 0;
    if (mode === 'safest') {
      // 80% safety, 20% duration
      modeScore = r.safety.compositeSafetyScore * 0.85 - r.durationMinutes * 0.15;
    } else if (mode === 'balanced') {
      // 55% safety, 45% time/distance efficiency
      modeScore = r.safety.compositeSafetyScore * 0.6 - r.durationMinutes * 0.4;
    } else {
      // fastest: 75% speed, 25% safety
      modeScore = -r.durationMinutes * 0.8 + r.safety.compositeSafetyScore * 0.2;
    }
    return { ...r, modeScore };
  });

  scored.sort((a, b) => b.modeScore - a.modeScore);

  // Mark top one as recommended
  return scored.map((r, idx) => ({
    ...r,
    isRecommended: idx === 0,
  }));
}
