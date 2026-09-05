import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteAlternative, CommunityReport, SafetyPOI } from '../types';

interface MapComponentProps {
  userLocation: [number, number];
  destinationLocation: [number, number] | null;
  routes: RouteAlternative[];
  selectedRouteIndex: number;
  reports: CommunityReport[];
  safetyPOIs?: SafetyPOI[];
  onSelectRoute?: (index: number) => void;
  nextCheckInTimeStr?: string;
  isJourneyActive?: boolean;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  userLocation,
  destinationLocation,
  routes,
  selectedRouteIndex,
  reports,
  safetyPOIs = [],
  onSelectRoute,
  nextCheckInTimeStr = '15 mins',
  isJourneyActive = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylinesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: userLocation,
      zoom: 14,
      zoomControl: false,
    });

    // Clean, crisp OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    polylinesLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center when userLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo(userLocation, { animate: true, duration: 0.8 });
  }, [userLocation]);

  // Render Routes and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const polyGroup = polylinesLayerGroupRef.current;
    const markerGroup = markersLayerGroupRef.current;

    if (!map || !polyGroup || !markerGroup) return;

    polyGroup.clearLayers();
    markerGroup.clearLayers();

    // 1. User Marker (Indigo Pulse)
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute w-8 h-8 bg-indigo-500/30 rounded-full animate-ping"></span>
          <span class="absolute w-6 h-6 bg-indigo-500/40 rounded-full"></span>
          <span class="relative w-4 h-4 bg-indigo-600 border-2 border-white rounded-full shadow-md"></span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    L.marker(userLocation, { icon: userIcon })
      .addTo(markerGroup)
      .bindPopup('<b>Starting / Current Point</b>');

    // 2. Destination Marker
    if (destinationLocation) {
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `
          <div class="relative flex items-center justify-center">
            <span class="w-8 h-8 bg-red-500/20 rounded-full absolute"></span>
            <div class="w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              </svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      L.marker(destinationLocation, { icon: destIcon })
        .addTo(markerGroup)
        .bindPopup('<b>Destination Point</b>');
    }

    // 3. Real Community Hazard Reports
    reports.forEach((rep) => {
      const isHarassment = rep.category === 'harassment';
      const isLighting = rep.category === 'poor_lighting';
      const bgColor = isHarassment ? 'bg-red-500' : isLighting ? 'bg-amber-500' : 'bg-orange-500';

      const hazardIcon = L.divIcon({
        className: 'custom-hazard-marker',
        html: `
          <div class="w-6 h-6 ${bgColor} text-white rounded-full flex items-center justify-center shadow-md border-2 border-white cursor-pointer hover:scale-110 transition-transform">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      L.marker(rep.location, { icon: hazardIcon })
        .addTo(markerGroup)
        .bindPopup(`
          <div class="p-1">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">${rep.category.replace('_', ' ')}</span>
            <strong class="text-xs text-slate-800">${rep.title}</strong>
            <p class="text-xs text-slate-600 mt-1">${rep.description}</p>
          </div>
        `);
    });

    // 4. Draw Routes
    const bounds = L.latLngBounds([userLocation]);
    if (destinationLocation) bounds.extend(destinationLocation);

    routes.forEach((route, index) => {
      const isSelected = index === selectedRouteIndex;

      const polyline = L.polyline(route.geometry, {
        color: isSelected ? '#4F46E5' : '#94A3B8',
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 0.95 : 0.6,
        dashArray: isSelected ? undefined : '6, 6',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(polyGroup);

      route.geometry.forEach((pt) => bounds.extend(pt));

      // Click to select route
      polyline.on('click', () => {
        if (onSelectRoute) onSelectRoute(index);
      });
    });

    // Fit map bounds smoothly if destination exists
    if (routes.length > 0 || destinationLocation) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [userLocation, destinationLocation, routes, selectedRouteIndex, reports]);

  const selectedRoute = routes[selectedRouteIndex];

  // Estimated Arrival time calculation
  const arrivalTimeStr = selectedRoute
    ? new Date(Date.now() + selectedRoute.durationMinutes * 60000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--';

  const riskBadgeClass =
    selectedRoute?.safety.riskLevel === 'low'
      ? 'text-emerald-600'
      : selectedRoute?.safety.riskLevel === 'moderate'
      ? 'text-indigo-600'
      : selectedRoute?.safety.riskLevel === 'elevated'
      ? 'text-amber-600'
      : 'text-red-600';

  return (
    <div className="flex-1 bg-slate-100 rounded-[24px] md:rounded-[32px] border-4 border-white shadow-xl relative overflow-hidden flex flex-col min-h-[400px] md:min-h-[520px]">
      {/* Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Floating HUD Elements */}
      <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-between pointer-events-none z-10">
        {/* Top Badges */}
        <div className="flex justify-between items-start gap-2">
          {/* SafeCheck HUD Card */}
          <div className="bg-white/95 backdrop-blur p-2.5 sm:p-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3 pointer-events-auto transition-transform hover:scale-102">
            <div className={`w-3 h-3 rounded-full ${isJourneyActive ? 'bg-indigo-600 animate-ping' : 'bg-emerald-500'}`} />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase leading-none">SafeCheck</p>
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {isJourneyActive ? `Next check-in: ${nextCheckInTimeStr}` : 'Ready to start'}
              </p>
            </div>
          </div>

          {/* Location status badge */}
          <div className="bg-white/95 backdrop-blur px-3 py-2 rounded-xl shadow-lg border border-slate-100 pointer-events-auto text-right">
            <p className="text-[9px] font-black text-slate-400 uppercase">Interactive Map</p>
            <p className="text-xs font-bold text-slate-800">
              {destinationLocation ? `${routes.length} Safe Route${routes.length === 1 ? '' : 's'}` : 'Select destination'}
            </p>
          </div>
        </div>

        {/* Center Prompt when no route selected */}
        {routes.length === 0 && !destinationLocation && (
          <div className="self-center bg-white/95 backdrop-blur px-5 py-3 rounded-2xl shadow-md border border-slate-200 pointer-events-auto text-center max-w-sm">
            <p className="text-xs font-bold text-slate-800">Search an Indian destination to compare safe routes</p>
            <p className="text-[11px] text-slate-500 mt-1">Evaluates thoroughfares, lighting, and community safety reports</p>
          </div>
        )}

        {/* Bottom Floating Stats Pill */}
        {selectedRoute && (
          <div className="flex justify-center pointer-events-auto">
            <div className="bg-white/95 backdrop-blur px-5 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-xl border border-white flex items-center gap-4 sm:gap-6">
              <div className="text-center">
                <p className="text-[9px] uppercase font-bold text-slate-400">Arrival</p>
                <p className="text-xs sm:text-sm font-black text-slate-800">{arrivalTimeStr}</p>
              </div>
              <div className="h-6 w-[1px] bg-slate-200" />
              <div className="text-center">
                <p className="text-[9px] uppercase font-bold text-slate-400">Distance</p>
                <p className="text-xs sm:text-sm font-black text-slate-800">{selectedRoute.distanceKm} km</p>
              </div>
              <div className="h-6 w-[1px] bg-slate-200" />
              <div className="text-center">
                <p className="text-[9px] uppercase font-bold text-slate-400">Safety</p>
                <p className={`text-xs sm:text-sm font-black uppercase ${riskBadgeClass}`}>
                  {selectedRoute.safety.compositeSafetyScore}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
