import React, { useState } from 'react';
import { Search, MapPin, X, Navigation2, Compass } from 'lucide-react';
import { searchAddress } from '../services/nominatim';

interface DestinationSearchProps {
  onDestinationSelect: (coords: [number, number], name: string) => void;
  currentDestinationName?: string;
  onClearDestination?: () => void;
}

const INDIAN_POPULAR_HUBS = [
  { name: 'Nagpur Railway Station', query: 'Nagpur Railway Station, Maharashtra' },
  { name: 'Sitabuldi Metro, Nagpur', query: 'Sitabuldi, Nagpur' },
  { name: 'CSMT Station, Mumbai', query: 'Chhatrapati Shivaji Maharaj Terminus, Mumbai' },
  { name: 'Pune Railway Station', query: 'Pune Junction Railway Station, Maharashtra' },
  { name: 'Connaught Place, New Delhi', query: 'Connaught Place, New Delhi' },
  { name: 'Majestic Metro, Bengaluru', query: 'Majestic Bus Station, Bengaluru' },
];

export const DestinationSearch: React.FC<DestinationSearchProps> = ({
  onDestinationSelect,
  currentDestinationName,
  onClearDestination,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ displayName: string; lat: number; lng: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleInputChange = async (val: string) => {
    setQuery(val);
    if (val.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchAddress(val);
      setSuggestions(results);
    } catch (err) {
      console.warn('Geocoding error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (s: { displayName: string; lat: number; lng: number }) => {
    onDestinationSelect([s.lat, s.lng], s.displayName);
    setQuery('');
    setSuggestions([]);
  };

  const handleQuickSelect = async (hub: { name: string; query: string }) => {
    setIsSearching(true);
    try {
      const results = await searchAddress(hub.query);
      if (results.length > 0) {
        handleSelect(results[0]);
      } else {
        setQuery(hub.name);
      }
    } catch (err) {
      console.warn('Quick hub error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
            <Navigation2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Destination</span>
            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-[220px] sm:max-w-md">
              {currentDestinationName || 'Where do you want to go?'}
            </p>
          </div>
        </div>

        {currentDestinationName && onClearDestination && (
          <button
            onClick={onClearDestination}
            className="text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Search Field */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Search India: metro, bus stop, landmark, PIN code..."
          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
            }}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSearching && <p className="text-[10px] text-slate-400 pl-1">Searching Indian locations...</p>}

      {/* Autocomplete Dropdown */}
      {suggestions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100 z-30">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(s)}
              className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-start gap-2.5"
            >
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-800 line-clamp-1">{s.displayName.split(',')[0]}</span>
                <span className="text-[11px] text-slate-500 line-clamp-1">{s.displayName}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick Indian Transit Hubs */}
      {!currentDestinationName && suggestions.length === 0 && (
        <div className="pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <Compass className="w-3 h-3 text-slate-400" />
            <span>Popular Transit Points in India</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {INDIAN_POPULAR_HUBS.map((hub, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickSelect(hub)}
                className="text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
              >
                {hub.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
