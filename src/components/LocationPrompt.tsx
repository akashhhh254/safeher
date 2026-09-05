import React, { useState } from 'react';
import { MapPin, Navigation, Search, AlertCircle, CheckCircle2, LocateFixed } from 'lucide-react';
import { searchAddress } from '../services/nominatim';

interface LocationPromptProps {
  onLocationSelected: (coords: [number, number], addressName: string) => void;
  currentAddressName?: string;
  hasLocation: boolean;
}

export const LocationPrompt: React.FC<LocationPromptProps> = ({
  onLocationSelected,
  currentAddressName,
  hasLocation,
}) => {
  const [manualInput, setManualInput] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ displayName: string; lat: number; lng: number }>>([]);
  const [showManualInput, setShowManualInput] = useState(false);

  const handleUseGPS = () => {
    setPermissionError(null);
    if (!('geolocation' in navigator)) {
      setPermissionError('Geolocation is not supported by your browser. Please enter your location manually.');
      setShowManualInput(true);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        onLocationSelected([lat, lng], `GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Location permission was not granted. Please enter your location manually.';
        if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'GPS signal unavailable. Please enter your location manually.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Location request timed out. Please enter your location manually.';
        }
        setPermissionError(msg);
        setShowManualInput(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualSearch = async (query: string) => {
    setManualInput(query);
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchAddress(query);
      setSuggestions(results);
    } catch (err) {
      console.warn('Geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (s: { displayName: string; lat: number; lng: number }) => {
    onLocationSelected([s.lat, s.lng], s.displayName);
    setManualInput('');
    setSuggestions([]);
    setShowManualInput(false);
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <LocateFixed className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Starting Point</span>
            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[220px] sm:max-w-md">
              {hasLocation ? currentAddressName : 'No starting point selected'}
            </p>
          </div>
        </div>

        {hasLocation && (
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {showManualInput ? 'Cancel' : 'Change'}
          </button>
        )}
      </div>

      {permissionError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>{permissionError}</span>
        </div>
      )}

      {(!hasLocation || showManualInput) && (
        <div className="pt-2 space-y-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 leading-relaxed">
            SafeHer needs your location to find routes and safety information around you.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleUseGPS}
              disabled={isLocating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Acquiring GPS...' : 'Use My Current Location'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Enter Location Manually
            </button>
          </div>

          {showManualInput && (
            <div className="space-y-2 pt-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => handleManualSearch(e.target.value)}
                  placeholder="e.g. Nagpur Railway Station, Sitabuldi, Mumbai, Delhi..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {isSearching && <p className="text-[10px] text-slate-400 pl-1">Searching Indian places...</p>}

              {suggestions.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 transition-colors flex items-start gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-700 line-clamp-1">{s.displayName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
