import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import {
  ShieldCheck,
  AlertCircle,
  Navigation,
  Clock,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  Plus,
  Users,
  MapPin,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { auth } from './services/firebase';
import {
  getEmergencyContactsFromFirestore,
  saveEmergencyContactToFirestore,
  deleteEmergencyContactFromFirestore,
  setPrimaryContactInFirestore,
  getCommunityReportsFromFirestore,
  addCommunityReportToFirestore,
  getUserJourneysFromFirestore,
  saveJourneyToFirestore,
} from './services/firestoreService';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { MapComponent } from './components/MapComponent';
import { LocationPrompt } from './components/LocationPrompt';
import { DestinationSearch } from './components/DestinationSearch';
import { RouteCard } from './components/RouteCard';
import { BentoMetricsRow } from './components/BentoMetricsRow';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
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
} from './types';
import { fetchRoutesFromOSRM, rankRoutesForMode } from './services/routing';
import { sound } from './services/audio';

// Nagpur Zero Mile (Geographical Center of India) as baseline map reference
const INDIA_CENTER: [number, number] = [21.1458, 79.0882];

export default function App() {
  // Navigation & View State
  const [showLanding, setShowLanding] = useState<boolean>(true);
  const [currentTab, setCurrentTab] = useState<'navigate' | 'reports' | 'contacts' | 'history'>('navigate');

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Geographic & Route State
  const [userLocation, setUserLocation] = useState<[number, number]>(INDIA_CENTER);
  const [hasAcquiredLocation, setHasAcquiredLocation] = useState<boolean>(false);
  const [originAddress, setOriginAddress] = useState<string>('Select starting point');
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [destinationName, setDestinationName] = useState<string>('');

  const [routeMode, setRouteMode] = useState<RouteMode>('safest');
  const [routes, setRoutes] = useState<RouteAlternative[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Firestore Collections State
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [pastJourneys, setPastJourneys] = useState<ActiveJourney[]>([]);

  // Active Safe Journey & SafeCheck State
  const [activeJourney, setActiveJourney] = useState<ActiveJourney | null>(null);
  const [checkInIntervalMinutes, setCheckInIntervalMinutes] = useState<number>(15);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [isSafeCheckPromptOpen, setIsSafeCheckPromptOpen] = useState<boolean>(false);
  const [graceSecondsRemaining, setGraceSecondsRemaining] = useState<number>(120);

  // Modals
  const [isSOSModalOpen, setIsSOSModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isContactsModalOpen, setIsContactsModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // 1. Listen for Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load user-specific contacts and journeys from Firestore
        const userContacts = await getEmergencyContactsFromFirestore(user.uid);
        setContacts(userContacts);
        const userJourneys = await getUserJourneysFromFirestore(user.uid);
        setPastJourneys(userJourneys);
      } else {
        // Guest mode fallback contacts from localStorage
        const savedContacts = localStorage.getItem('safeher_guest_contacts');
        if (savedContacts) {
          try {
            setContacts(JSON.parse(savedContacts));
          } catch (e) {
            setContacts([]);
          }
        } else {
          setContacts([]);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Public Community Hazard Reports from Firestore
  useEffect(() => {
    const fetchReports = async () => {
      const liveReports = await getCommunityReportsFromFirestore();
      setReports(liveReports);
    };
    fetchReports();
  }, []);

  // 3. Attempt initial GPS acquisition once
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserLocation([lat, lng]);
          setHasAcquiredLocation(true);
          setOriginAddress(`My Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        },
        () => {
          // If not permitted, user will use LocationPrompt explicitly
        },
        { timeout: 6000, enableHighAccuracy: true }
      );
    }
  }, []);

  // 4. Calculate Routes when origin & destination are available
  useEffect(() => {
    if (hasAcquiredLocation && destinationCoords) {
      calculateRoutes(userLocation, destinationCoords);
    }
  }, [userLocation, destinationCoords, hasAcquiredLocation, reports]);

  const calculateRoutes = async (origin: [number, number], dest: [number, number]) => {
    setIsLoadingRoutes(true);
    setRouteError(null);
    try {
      const alternatives = await fetchRoutesFromOSRM(origin, dest, reports);
      if (alternatives.length === 0) {
        setRouteError('No direct pedestrian or road route found between these points.');
        setRoutes([]);
        return;
      }
      const ranked = rankRoutesForMode(alternatives, routeMode);
      setRoutes(ranked);
      setSelectedRouteIndex(0);

      // Request AI explanation for recommended route
      if (ranked[0]) {
        fetchAIExplanation(ranked[0]);
      }
    } catch (err: any) {
      console.error('Routing calculation error:', err);
      setRouteError('Could not calculate routes. Please check connection or choose a different landmark.');
      setRoutes([]);
    } finally {
      setIsLoadingRoutes(false);
    }
  };

  const fetchAIExplanation = async (targetRoute: RouteAlternative) => {
    try {
      const res = await fetch('/api/gemini/explain-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: targetRoute,
          allRoutes: routes,
          destinationName,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoutes((prev) =>
          prev.map((r) => (r.id === targetRoute.id ? { ...r, aiExplanation: data.explanation } : r))
        );
      }
    } catch (err) {
      console.warn('AI explanation endpoint call skipped:', err);
    }
  };

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

  // 5. SafeCheck Active Countdown Loop
  useEffect(() => {
    if (!activeJourney || activeJourney.status === 'completed') return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setIsSafeCheckPromptOpen(true);
          sound.playSafeCheckReminder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeJourney]);

  // 6. Grace Period Loop during SafeCheck Prompt
  useEffect(() => {
    if (!isSafeCheckPromptOpen) return;

    const graceTimer = setInterval(() => {
      setGraceSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Grace expired without confirmation -> Trigger SOS Broadcast!
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

  // Start Journey
  const handleStartJourney = () => {
    const selectedRoute = routes[selectedRouteIndex];
    if (!selectedRoute || !destinationCoords) return;

    const journey: ActiveJourney = {
      id: `journey-${Date.now()}`,
      route: selectedRoute,
      originName: originAddress,
      destinationName: destinationName || 'Destination',
      originCoords: userLocation,
      destinationCoords: destinationCoords,
      mode: routeMode,
      startedAt: Date.now(),
      checkInIntervalMinutes,
      nextCheckInTimestamp: Date.now() + checkInIntervalMinutes * 60 * 1000,
      lastCheckInTimestamp: Date.now(),
      status: 'active',
    };

    setActiveJourney(journey);
    setSecondsRemaining(checkInIntervalMinutes * 60);
    sound.playSafeConfirmed();
  };

  // Confirm "I'M SAFE"
  const handleConfirmSafe = () => {
    sound.playSafeConfirmed();
    setIsSafeCheckPromptOpen(false);
    setGraceSecondsRemaining(120);
    setSecondsRemaining(checkInIntervalMinutes * 60);

    if (activeJourney) {
      setActiveJourney({
        ...activeJourney,
        lastCheckInTimestamp: Date.now(),
        nextCheckInTimestamp: Date.now() + checkInIntervalMinutes * 60 * 1000,
      });
    }
  };

  // End Journey
  const handleEndJourney = async () => {
    if (!activeJourney) return;

    const completed: ActiveJourney = {
      ...activeJourney,
      status: 'completed',
    };

    setActiveJourney(null);
    setPastJourneys((prev) => [completed, ...prev]);

    // Save to Firestore if user logged in
    if (currentUser) {
      await saveJourneyToFirestore(currentUser.uid, completed);
    }
  };

  // Add Contact Handler
  const handleAddContact = async (contactData: Omit<EmergencyContact, 'id'>) => {
    if (currentUser) {
      const newId = await saveEmergencyContactToFirestore(currentUser.uid, contactData);
      setContacts((prev) => [...prev, { ...contactData, id: newId }]);
    } else {
      const guestId = `guest-c-${Date.now()}`;
      const updated = [...contacts, { ...contactData, id: guestId }];
      setContacts(updated);
      localStorage.setItem('safeher_guest_contacts', JSON.stringify(updated));
    }
  };

  // Remove Contact Handler
  const handleRemoveContact = async (id: string) => {
    if (currentUser) {
      await deleteEmergencyContactFromFirestore(currentUser.uid, id);
    }
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    if (!currentUser) {
      localStorage.setItem('safeher_guest_contacts', JSON.stringify(updated));
    }
  };

  // Set Primary Contact Handler
  const handleSetPrimary = async (id: string) => {
    if (currentUser) {
      await setPrimaryContactInFirestore(currentUser.uid, id);
    }
    const updated = contacts.map((c) => ({ ...c, isPrimary: c.id === id }));
    setContacts(updated);
    if (!currentUser) {
      localStorage.setItem('safeher_guest_contacts', JSON.stringify(updated));
    }
  };

  // Add Community Report Handler
  const handleAddReport = async (reportData: Omit<CommunityReport, 'id' | 'createdAt' | 'upvotes' | 'status'>) => {
    const authorId = currentUser ? currentUser.uid : 'anonymous';
    const reportId = await addCommunityReportToFirestore(reportData, authorId);
    const newReport: CommunityReport = {
      ...reportData,
      id: reportId,
      createdAt: new Date().toISOString(),
      upvotes: 1,
      status: 'active',
    };
    setReports((prev) => [newReport, ...prev]);
  };

  // Sign out handler
  const handleSignOut = async () => {
    await signOut(auth);
    setPastJourneys([]);
    setContacts([]);
  };

  // SafeCheck countdown format
  const countdownMin = Math.floor(secondsRemaining / 60);
  const countdownSec = secondsRemaining % 60;
  const countdownStr = `${countdownMin}:${countdownSec < 10 ? `0${countdownSec}` : countdownSec}`;

  // If user is viewing the landing page
  if (showLanding) {
    return (
      <>
        <LandingPage
          onGetStarted={() => {
            setShowLanding(false);
          }}
          onSignIn={() => {
            setIsAuthModalOpen(true);
          }}
          onLearnMore={() => setShowLanding(false)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  const selectedRoute = routes[selectedRouteIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col p-3 sm:p-5 md:p-6 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Application Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onTriggerSOS={() => setIsSOSModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isLoggedIn={Boolean(currentUser)}
        userName={currentUser?.displayName || undefined}
        isJourneyActive={Boolean(activeJourney && activeJourney.status === 'active')}
      />

      {/* Main Tab Views */}
      <main className="flex-1 flex flex-col">
        {/* ===================== TAB: NAVIGATE ===================== */}
        {currentTab === 'navigate' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 md:gap-6">
            {/* Left Column: Search & Route Engine Panel */}
            <div className="w-full lg:w-[420px] flex flex-col gap-3.5 order-2 lg:order-1">
              {/* Location Starting Point Picker */}
              <LocationPrompt
                onLocationSelected={(coords, name) => {
                  setUserLocation(coords);
                  setHasAcquiredLocation(true);
                  setOriginAddress(name);
                }}
                currentAddressName={originAddress}
                hasLocation={hasAcquiredLocation}
              />

              {/* Destination Search Field */}
              <DestinationSearch
                onDestinationSelect={(coords, name) => {
                  setDestinationCoords(coords);
                  setDestinationName(name);
                }}
                currentDestinationName={destinationName}
                onClearDestination={() => {
                  setDestinationCoords(null);
                  setDestinationName('');
                  setRoutes([]);
                  setRouteError(null);
                }}
              />

              {/* Active Journey Controller Card */}
              {activeJourney ? (
                <div className="bg-indigo-950 text-white p-5 rounded-2xl border border-indigo-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        SafeCheck Active
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold bg-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-700">
                      Check-in in: {countdownStr}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-100 truncate">
                      En route to: {activeJourney.destinationName}
                    </h3>
                    <p className="text-xs text-indigo-300 mt-0.5">
                      {activeJourney.route.distanceKm} km • Safety Score: {activeJourney.route.safety.compositeSafetyScore}%
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmSafe}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>I'm Safe</span>
                    </button>

                    <button
                      onClick={handleEndJourney}
                      className="bg-indigo-900 hover:bg-indigo-800 text-slate-200 px-4 py-3 rounded-xl text-xs font-bold transition-all border border-indigo-700 cursor-pointer flex items-center gap-1.5"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>End</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Route Alternatives Configuration */
                routes.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    {/* Mode selector */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Route Priority
                      </span>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        {(['safest', 'balanced', 'fastest'] as RouteMode[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => handleModeChange(m)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                              routeMode === m
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Route Cards */}
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {routes.map((r, i) => (
                        <RouteCard
                          key={r.id}
                          route={r}
                          isSelected={i === selectedRouteIndex}
                          onSelect={() => setSelectedRouteIndex(i)}
                        />
                      ))}
                    </div>

                    {/* SafeCheck Interval Configuration & Start Journey */}
                    <div className="pt-2 border-t border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700">SafeCheck Interval</span>
                        <div className="flex gap-1">
                          {[15, 30, 60].map((mins) => (
                            <button
                              key={mins}
                              onClick={() => setCheckInIntervalMinutes(mins)}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                checkInIntervalMinutes === mins
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {mins}m
                            </button>
                          ))}
                          <button
                            onClick={() => setCheckInIntervalMinutes(0.5)}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              checkInIntervalMinutes === 0.5
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                            title="Test 30-second interval"
                          >
                            30s (demo)
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleStartJourney}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        <span>Start Protected Journey</span>
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* Loading Routes Spinner */}
              {isLoadingRoutes && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-800">Calculating safety-aware routes...</p>
                  <p className="text-[11px] text-slate-400">Analyzing street lighting, facilities, and community reports</p>
                </div>
              )}

              {/* Route Error Notification */}
              {routeError && (
                <div className="bg-red-50 p-4 rounded-2xl border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{routeError}</span>
                </div>
              )}
            </div>

            {/* Right Column: Interactive Map */}
            <div className="flex-1 flex flex-col order-1 lg:order-2">
              <MapComponent
                userLocation={userLocation}
                destinationLocation={destinationCoords}
                routes={routes}
                selectedRouteIndex={selectedRouteIndex}
                reports={reports}
                onSelectRoute={(idx) => setSelectedRouteIndex(idx)}
                isJourneyActive={Boolean(activeJourney && activeJourney.status === 'active')}
                nextCheckInTimeStr={countdownStr}
              />
            </div>
          </div>
        )}

        {/* ===================== TAB: REPORTS ===================== */}
        {currentTab === 'reports' && (
          <div className="max-w-4xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Community Safety Reports</h2>
                <p className="text-xs text-slate-500">Live geo-tagged reports published by fellow travelers</p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Submit Report</span>
              </button>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
                <AlertTriangle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No safety reports in this area yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Help keep others safe by submitting a report if you encounter poor lighting, isolated areas, or road hazards.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {rep.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(rep.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">{rep.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{rep.description}</p>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="truncate max-w-[200px]">{rep.address || 'Geo-tagged coordinates'}</span>
                      </div>
                      <span className="font-bold text-slate-600">{rep.upvotes || 1} verified</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: CONTACTS ===================== */}
        {currentTab === 'contacts' && (
          <div className="max-w-3xl mx-auto w-full space-y-4">
            <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Trusted Emergency Contacts</h2>
                <p className="text-xs text-slate-500">
                  {currentUser ? 'Stored securely in your private Firebase account' : 'Guest session (saved locally)'}
                </p>
              </div>
              <button
                onClick={() => setIsContactsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Manage Contacts</span>
              </button>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Add a trusted contact before enabling automatic alerts</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Your primary contact will receive automated SMS and WhatsApp emergency broadcasts if you miss a SafeCheck or trigger SOS.
                </p>
                <button
                  onClick={() => setIsContactsModalOpen(true)}
                  className="mt-4 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100"
                >
                  Add First Contact
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                      {c.isPrimary && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{c.relationship}</p>
                    <p className="text-xs font-bold text-indigo-600 pt-1">{c.phone}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB: HISTORY ===================== */}
        {currentTab === 'history' && (
          <div className="max-w-3xl mx-auto w-full space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Protected Journey Logs</h2>
              <p className="text-xs text-slate-500">History of completed journeys and safety ratings</p>
            </div>

            {pastJourneys.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 p-6">
                <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No recorded journeys yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Start and complete your first protected journey with SafeCheck to view logs here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pastJourneys.map((j) => (
                  <div
                    key={j.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>{j.destinationName}</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        From: {j.originName} • {new Date(j.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        {j.route.distanceKm} km ({j.route.durationMinutes} min)
                      </span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        {j.route.safety.compositeSafetyScore}% Safety
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Bento Metrics Row (when on Navigate tab) */}
        {currentTab === 'navigate' && (
          <BentoMetricsRow
            contactsCount={contacts.length}
            reportsCount={reports.length}
            isJourneyActive={Boolean(activeJourney && activeJourney.status === 'active')}
            onQuickCheckIn={handleConfirmSafe}
            onOpenContacts={() => setIsContactsModalOpen(true)}
            onOpenReports={() => setIsReportModalOpen(true)}
          />
        )}
      </main>

      {/* Floating Bottom Disclaimer */}
      <footer className="mt-6 text-center text-[11px] text-slate-400 space-y-1">
        <p>
          Emergency Hotlines: Dial <strong>112</strong> (National Emergency / ERSS) or <strong>1091</strong> (Women Helpline).
        </p>
        <p>
          SafeHer runs in your browser. Keep this tab open during travel for active SafeCheck notifications.
        </p>
      </footer>

      {/* All Modal Windows */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={currentUser}
        onSignOut={handleSignOut}
      />

      <SOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
        userLocation={userLocation}
        contacts={contacts}
        destinationName={destinationName}
      />

      <SafeCheckPromptModal
        isOpen={isSafeCheckPromptOpen}
        onConfirmSafe={handleConfirmSafe}
        onTriggerSOS={() => {
          setIsSafeCheckPromptOpen(false);
          setIsSOSModalOpen(true);
        }}
        graceSecondsRemaining={graceSecondsRemaining}
      />

      <CommunityReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userLocation={userLocation}
        onSubmitReport={handleAddReport}
        isLoggedIn={Boolean(currentUser)}
        onPromptLogin={() => setIsAuthModalOpen(true)}
      />

      <EmergencyContactsModal
        isOpen={isContactsModalOpen}
        onClose={() => setIsContactsModalOpen(false)}
        contacts={contacts}
        onAddContact={handleAddContact}
        onRemoveContact={handleRemoveContact}
        onSetPrimary={handleSetPrimary}
        isLoggedIn={Boolean(currentUser)}
        onPromptLogin={() => setIsAuthModalOpen(true)}
      />

      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        pastJourneys={pastJourneys}
      />
    </div>
  );
}
