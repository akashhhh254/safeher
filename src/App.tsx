import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Sliders,
  Sparkles,
  Shield,
  ShieldAlert,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  LocateFixed
} from 'lucide-react';
import { Header } from './components/Header';
import { MapComponent } from './components/MapComponent';
import { RouteCard } from './components/RouteCard';
import { BentoMetricsRow } from './components/BentoMetricsRow';
import { SOSModal } from './components/SOSModal';
import { SafeCheckPromptModal } from './components/SafeCheckPromptModal';
import { CommunityReportModal } from './components/CommunityReportModal';
import { EmergencyContactsModal } from './components/EmergencyContactsModal';
import { HistoryModal } from './components/HistoryModal';
import {
  RouteAlternative,
  CommunityReport,
  EmergencyContact,
  ActiveJourney,
  RouteMode,
  SafetyPOI
} from './types';
import { fetchRoutesFromOSRM, rankRoutesForMode } from './services/routing';
import { searchAddress } from './services/nominatim';
import { sound } from './services/audio';

// Default initial coordinates (Grand Central area)
const DEFAULT_ORIGIN: [number, number] = [40.7527, -73.9772];
const DEFAULT_DESTINATION: [number, number] = [40.7484, -73.9857]; // Empire State area

// Initial verified safety POIs (Police, 24/7 Medical)
const INITIAL_SAFETY_POIS: SafetyPOI[] = [
  { id: 'poi-1', name: 'Midtown Police Precinct', type: 'police', location: [40.7538, -73.9815], distanceKm: 0.4 },
  { id: 'poi-2', name: 'City Hospital Emergency Hub', type: 'hospital', location: [40.7495, -73.9820], distanceKm: 0.6 }
];

// Initial realistic community reports
const INITIAL_REPORTS: CommunityReport[] = [
  {
    id: 'rep-1',
    category: 'poor_lighting',
    title: 'Street lights flickering & dark sidewalk',
    description: 'The block between 41st and 42nd is completely unlit past 9 PM.',
    location: [40.7515, -73.9810],
    createdAt: new Date().toISOString(),
    upvotes: 8,
    status: 'active'
  },
  {
    id: 'rep-2',
    category: 'harassment',
    title: 'Persistent catcalling reported',
    description: 'Group loitering near empty storefront, verbal harassment.',
    location: [40.7502, -73.9835],
    createdAt: new Date().toISOString(),
    upvotes: 14,
    status: 'active'
  },
  {
    id: 'rep-3',
    category: 'road_issue',
    title: 'Sidewalk construction barricades',
    description: 'Narrow walkway forced onto road without pedestrian lighting.',
    location: [40.7540, -73.9790],
    createdAt: new Date().toISOString(),
    upvotes: 4,
    status: 'active'
  }
];

// Initial default emergency contacts
const INITIAL_CONTACTS: EmergencyContact[] = [
  {
    id: 'c-1',
    name: 'Sarah (Sister)',
    relationship: 'Sibling',
    phone: '+1 (555) 234-5678',
    isPrimary: true
  },
  {
    id: 'c-2',
    name: 'Mom',
    relationship: 'Parent',
    phone: '+1 (555) 987-6543',
    isPrimary: false
  },
  {
    id: 'c-3',
    name: 'Elena (Roommate)',
    relationship: 'Friend',
    phone: '+1 (555) 345-6789',
    isPrimary: false
  }
];

export default function App() {
  // Navigation & View Tabs
  const [currentTab, setCurrentTab] = useState<'navigate' | 'reports' | 'contacts' | 'history'>('navigate');

  // Geographic State
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_ORIGIN);
  const [originAddress, setOriginAddress] = useState<string>('Grand Central Terminal, NY');
  const [destinationInput, setDestinationInput] = useState<string>('Empire State Building, NY');
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(DEFAULT_DESTINATION);

  // Address search suggestions
  const [suggestions, setSuggestions] = useState<Array<{ displayName: string; lat: number; lng: number }>>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  // Routes & Mode State
  const [routeMode, setRouteMode] = useState<RouteMode>('balanced');
  const [routes, setRoutes] = useState<RouteAlternative[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);
  const [isExplainingRoute, setIsExplainingRoute] = useState(false);

  // Community Reports & Contacts State
  const [reports, setReports] = useState<CommunityReport[]>(() => {
    const saved = localStorage.getItem('safeher_reports');
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });

  const [contacts, setContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem('safeher_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  const [pastJourneys, setPastJourneys] = useState<ActiveJourney[]>(() => {
    const saved = localStorage.getItem('safeher_journeys');
    return saved ? JSON.parse(saved) : [];
  });

  // Active Safe Journey & SafeCheck State
  const [activeJourney, setActiveJourney] = useState<ActiveJourney | null>(null);
  const [checkInIntervalMinutes, setCheckInIntervalMinutes] = useState<number>(15);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [isSafeCheckPromptOpen, setIsSafeCheckPromptOpen] = useState(false);
  const [graceSecondsRemaining, setGraceSecondsRemaining] = useState(120); // 2 min grace

  // Modals
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Persist State
  useEffect(() => {
    localStorage.setItem('safeher_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('safeher_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('safeher_journeys', JSON.stringify(pastJourneys));
  }, [pastJourneys]);

  // Try GPS Geolocation on mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation([lat, lng]);
          setOriginAddress(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        },
        (err) => {
          console.log('Using default reference location:', err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // Recalculate routes whenever user location or destination changes
  useEffect(() => {
    if (destinationCoords) {
      handleCalculateRoutes(userLocation, destinationCoords);
    }
  }, [destinationCoords, reports]);

  // Route calculation helper
  const handleCalculateRoutes = async (origin: [number, number], destination: [number, number]) => {
    setIsLoadingRoutes(true);
    try {
      const alternatives = await fetchRoutesFromOSRM(origin, destination, reports);
      const ranked = rankRoutesForMode(alternatives, routeMode);
      setRoutes(ranked);
      setSelectedRouteIndex(0);

      // Fetch AI explanation for recommended route
      if (ranked[0]) {
        fetchAIExplanation(ranked[0]);
      }
    } catch (e) {
      console.error('Error calculating routes:', e);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  // Re-rank routes when user switches mode (Safest / Balanced / Fastest)
  const handleModeChange = (newMode: RouteMode) => {
    setRouteMode(newMode);
    if (routes.length > 0) {
      const reRanked = rankRoutesForMode(routes, newMode);
      setRoutes(reRanked);
      setSelectedRouteIndex(0);
      if (reRanked[0]) {
        fetchAIExplanation(reRanked[0]);
      }
    }
  };

  // Fetch grounded AI explanation from backend
  const fetchAIExplanation = async (targetRoute: RouteAlternative) => {
    setIsExplainingRoute(true);
    try {
      const res = await fetch('/api/gemini/explain-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: targetRoute,
          allRoutes: routes,
          destinationName: destinationInput
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes((prev) =>
          prev.map((r) => (r.id === targetRoute.id ? { ...r, aiExplanation: data.explanation } : r))
        );
      }
    } catch (err) {
      console.warn('AI explanation endpoint unavailable:', err);
    } finally {
      setIsExplainingRoute(false);
    }
  };

  // Live address search handler
  const handleSearchInput = async (value: string) => {
    setDestinationInput(value);
    if (value.trim().length >= 3) {
      setIsSearchingAddress(true);
      const results = await searchAddress(value);
      setSuggestions(results);
      setIsSearchingAddress(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item: { displayName: string; lat: number; lng: number }) => {
    setDestinationInput(item.displayName);
    setDestinationCoords([item.lat, item.lng]);
    setSuggestions([]);
  };

  // SafeCheck Countdown Loop
  useEffect(() => {
    if (!activeJourney || activeJourney.status === 'completed') return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Timer elapsed! Open SafeCheck prompt
          setIsSafeCheckPromptOpen(true);
          sound.playSafeCheckReminder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeJourney]);

  // Grace period countdown when SafeCheck prompt is active
  useEffect(() => {
    if (!isSafeCheckPromptOpen) return;

    const graceTimer = setInterval(() => {
      setGraceSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Escalation triggered! Sound emergency alert and open SOS
          sound.playOverdueAlert();
          setIsSafeCheckPromptOpen(false);
          setIsSOSModalOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(graceTimer);
  }, [isSafeCheckPromptOpen]);

  // Start a protected journey
  const handleStartJourney = () => {
    const selectedRoute = routes[selectedRouteIndex];
    if (!selectedRoute || !destinationCoords) return;

    const journey: ActiveJourney = {
      id: `journey-${Date.now()}`,
      route: selectedRoute,
      originName: originAddress,
      destinationName: destinationInput,
      originCoords: userLocation,
      destinationCoords: destinationCoords,
      mode: routeMode,
      startedAt: Date.now(),
      checkInIntervalMinutes: checkInIntervalMinutes,
      nextCheckInTimestamp: Date.now() + checkInIntervalMinutes * 60 * 1000,
      lastCheckInTimestamp: Date.now(),
      status: 'active'
    };

    setActiveJourney(journey);
    setSecondsRemaining(checkInIntervalMinutes * 60);
    sound.playSafeConfirmed();
  };

  // User confirms "I'M SAFE"
  const handleConfirmSafe = () => {
    sound.playSafeConfirmed();
    setIsSafeCheckPromptOpen(false);
    setGraceSecondsRemaining(120);
    setSecondsRemaining(checkInIntervalMinutes * 60);

    if (activeJourney) {
      setActiveJourney({
        ...activeJourney,
        lastCheckInTimestamp: Date.now(),
        nextCheckInTimestamp: Date.now() + checkInIntervalMinutes * 60 * 1000
      });
    }
  };

  // End Journey
  const handleEndJourney = () => {
    if (activeJourney) {
      const completed: ActiveJourney = {
        ...activeJourney,
        status: 'completed'
      };
      setPastJourneys((prev) => [completed, ...prev]);
    }
    setActiveJourney(null);
    setIsSafeCheckPromptOpen(false);
    sound.playSafeConfirmed();
  };

  // Add Community Report
  const handleAddReport = (rep: Omit<CommunityReport, 'id' | 'createdAt' | 'upvotes' | 'status'>) => {
    const newReport: CommunityReport = {
      ...rep,
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString(),
      upvotes: 1,
      status: 'active'
    };
    setReports((prev) => [newReport, ...prev]);
  };

  // Emergency Contact Operations
  const handleAddContact = (c: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      ...c,
      id: `contact-${Date.now()}`
    };
    setContacts((prev) => [...prev, newContact]);
  };

  const handleRemoveContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSetPrimaryContact = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => ({
        ...c,
        isPrimary: c.id === id
      }))
    );
  };

  // Formatting countdown for display
  const countdownMinutes = Math.floor(secondsRemaining / 60);
  const countdownSeconds = secondsRemaining % 60;
  const nextCheckInStr = activeJourney
    ? `${countdownMinutes}m ${countdownSeconds < 10 ? '0' : ''}${countdownSeconds}s`
    : `${checkInIntervalMinutes} mins`;

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col p-3 sm:p-5 md:p-6 font-sans text-slate-900 antialiased">
      <div className="w-full max-w-[1440px] mx-auto flex flex-col flex-1">
        {/* Bento Top Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'reports') setIsReportModalOpen(true);
            if (tab === 'contacts') setIsContactsModalOpen(true);
            if (tab === 'history') setIsHistoryModalOpen(true);
          }}
          onTriggerSOS={() => setIsSOSModalOpen(true)}
          activeJourneyCount={activeJourney ? 1 : 0}
        />

        {/* Main Bento Responsive Grid */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 overflow-hidden">
          {/* Left Column: Navigation Search, Modes & Route Comparison Cards */}
          <aside className="lg:col-span-4 flex flex-col gap-4">
            {/* Destination Input Bento Card */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-slate-400 block">
                  Your Destination
                </label>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Real GPS Routing
                </span>
              </div>

              {/* Destination Search Box */}
              <div className="relative">
                <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200 mb-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={destinationInput}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    placeholder="Enter street, landmark, or address..."
                    className="bg-transparent border-none text-xs sm:text-sm font-medium focus:outline-none w-full text-slate-800 placeholder:text-slate-400"
                  />
                  {isSearchingAddress && <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />}
                </div>

                {/* Auto-suggest dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden mt-1 max-h-48 overflow-y-auto">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-indigo-50 border-b border-slate-100 last:border-none flex items-start gap-2 text-slate-700"
                      >
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span className="truncate">{s.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mode Selection Tabs (Safest, Balanced, Fastest) */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-3">
                <button
                  onClick={() => handleModeChange('safest')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    routeMode === 'safest'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🛡 Safest
                </button>
                <button
                  onClick={() => handleModeChange('balanced')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    routeMode === 'balanced'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⚖ Balanced
                </button>
                <button
                  onClick={() => handleModeChange('fastest')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                    routeMode === 'fastest'
                      ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ⚡ Fastest
                </button>
              </div>

              {/* Quick Preset Landmarks */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-bold self-center">Presets:</span>
                {[
                  { name: 'Times Square', coords: [40.7580, -73.9855] as [number, number] },
                  { name: 'Bryant Park', coords: [40.7536, -73.9832] as [number, number] },
                  { name: 'Madison Square', coords: [40.7410, -73.9897] as [number, number] },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setDestinationInput(preset.name);
                      setDestinationCoords(preset.coords);
                    }}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-2 py-0.5 rounded-md transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Route Alternatives List */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[380px] lg:max-h-[460px] pr-1">
              {isLoadingRoutes ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Calculating Safe Corridors...</p>
                  <p className="text-[11px] text-slate-400">Evaluating lighting, public density & community hazards</p>
                </div>
              ) : routes.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 text-center">
                  <Navigation className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No Routes Loaded</p>
                  <p className="text-[11px] text-slate-400">Enter a destination above to see route alternatives.</p>
                </div>
              ) : (
                routes.map((route, idx) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    isSelected={idx === selectedRouteIndex}
                    onSelect={() => {
                      setSelectedRouteIndex(idx);
                      fetchAIExplanation(route);
                    }}
                  />
                ))
              )}
            </div>

            {/* SafeCheck Interval Configuration & Journey Trigger */}
            <div className="space-y-2">
              {/* SafeCheck Interval Selector */}
              <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-700">Check-in Interval:</span>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { label: '30s Demo', val: 0.5 },
                    { label: '15m', val: 15 },
                    { label: '30m', val: 30 }
                  ].map((intv) => (
                    <button
                      key={intv.label}
                      onClick={() => setCheckInIntervalMinutes(intv.val)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black transition-colors ${
                        checkInIntervalMinutes === intv.val
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {intv.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button: Start or End Journey */}
              {activeJourney ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmSafe}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-100 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>I'M SAFE ({countdownMinutes}:{countdownSeconds < 10 ? '0' : ''}{countdownSeconds})</span>
                  </button>
                  <button
                    onClick={handleEndJourney}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3.5 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1"
                    title="End Journey"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>End</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleStartJourney}
                  disabled={routes.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-2xl font-bold text-sm sm:text-base shadow-lg shadow-indigo-200 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Safe Journey</span>
                </button>
              )}
            </div>
          </aside>

          {/* Right Column: Interactive Leaflet Map Canvas + 3-Card Bento Metric Row */}
          <section className="lg:col-span-8 flex flex-col gap-4 sm:gap-6">
            {/* Map Frame with Bento HUD */}
            <MapComponent
              userLocation={userLocation}
              destinationLocation={destinationCoords}
              routes={routes}
              selectedRouteIndex={selectedRouteIndex}
              reports={reports}
              safetyPOIs={INITIAL_SAFETY_POIS}
              onSelectRoute={(idx) => {
                setSelectedRouteIndex(idx);
                if (routes[idx]) fetchAIExplanation(routes[idx]);
              }}
              nextCheckInTimeStr={nextCheckInStr}
              isJourneyActive={!!activeJourney}
            />

            {/* Bottom Bento Metric Row (Contacts, Reports, SafeCheck Action) */}
            <BentoMetricsRow
              contactsCount={contacts.length}
              reportsCount={reports.length}
              isJourneyActive={!!activeJourney}
              onQuickCheckIn={handleConfirmSafe}
              onOpenContacts={() => setIsContactsModalOpen(true)}
              onOpenReports={() => setIsReportModalOpen(true)}
            />
          </section>
        </main>
      </div>

      {/* Floating Modals */}
      {/* 1. SafeCheck Routine Modal */}
      <SafeCheckPromptModal
        isOpen={isSafeCheckPromptOpen}
        onConfirmSafe={handleConfirmSafe}
        onTriggerSOS={() => {
          setIsSafeCheckPromptOpen(false);
          setIsSOSModalOpen(true);
        }}
        graceSecondsRemaining={graceSecondsRemaining}
      />

      {/* 2. Emergency SOS Broadcast Modal */}
      <SOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
        userLocation={userLocation}
        contacts={contacts}
        destinationName={destinationInput}
      />

      {/* 3. Community Hazard Reporting Modal */}
      <CommunityReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userLocation={userLocation}
        onSubmitReport={handleAddReport}
      />

      {/* 4. Trusted Emergency Contacts Modal */}
      <EmergencyContactsModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        contacts={contacts}
        onAddContact={handleAddContact}
        onRemoveContact={handleRemoveContact}
        onSetPrimary={handleSetPrimaryContact}
      />

      {/* 5. Journey History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        pastJourneys={pastJourneys}
      />
    </div>
  );
}
