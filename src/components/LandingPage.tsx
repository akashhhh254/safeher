import React from 'react';
import {
  ShieldCheck,
  Navigation,
  Clock,
  AlertTriangle,
  PhoneCall,
  Lock,
  ArrowRight,
  Sparkles,
  ChevronDown,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLearnMore: () => void;
  onSignIn?: () => void;
  isLoggedIn?: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLearnMore,
  onSignIn,
  isLoggedIn = false,
}) => {
  const scrollToFeatures = () => {
    const el = document.getElementById('how-it-works-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      onLearnMore();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tight">SafeHer</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                India-First Women Safety
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={scrollToFeatures}
              className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors hidden sm:block cursor-pointer"
            >
              What You Can Do
            </button>
            {!isLoggedIn && onSignIn && (
              <button
                onClick={onSignIn}
                className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
            <button
              onClick={onGetStarted}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black tracking-wide shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>{isLoggedIn ? 'Open Dashboard' : 'Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200/80 px-3.5 py-1.5 rounded-full text-indigo-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dedicated Women Safety & AI-Guided Navigation in India</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            Navigate safely. <br className="hidden sm:inline" />
            Stay connected. Reach safely.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            SafeHer is an India-first personal safety web platform designed to evaluate travel routes using real street lighting, active public spaces, and community hazard alerts — keeping you and your trusted contacts protected at every step.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-base font-black tracking-wide shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>{isLoggedIn ? 'Go to Safety Dashboard' : 'Start Safe Journey'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={scrollToFeatures}
              className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-6 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore Platform Capabilities</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Quick Context Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto pt-8 text-left">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400">Emergency Support</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">India 112 & 1091</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400">Route Analysis</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">Lighting & Crowds</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400">Active Guardian</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">SafeCheck Timers</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400">Security Gate</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">Anti-Bot Protected</p>
            </div>
          </div>
        </div>
      </section>

      {/* About SafeHer Detailed Overview */}
      <section className="py-14 md:py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              About This Web Application
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Why SafeHer Was Built & What It Does
            </h2>
          </div>

          <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 text-slate-700 leading-relaxed space-y-4">
            <p className="text-sm sm:text-base">
              Standard navigation applications focus solely on the fastest or shortest distance, often directing pedestrians and travelers into poorly-lit back alleys, unpaved corridors, or isolated stretches after sundown.
            </p>
            <p className="text-sm sm:text-base">
              <strong>SafeHer re-engineers urban navigation</strong> with safety at the core. Designed specifically for Indian cities, towns, and transit hubs, it combines street lighting intelligence, commercial active density, 24/7 emergency facilities (police stations and hospitals), and real-time community hazard reporting into transparent safety scores.
            </p>
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3 text-xs sm:text-sm text-indigo-950 font-medium">
              <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                <strong>Data Protection & Anti-Bot Architecture:</strong> To safeguard your real-time GPS coordinates, trusted emergency contact numbers, and travel history, our dashboard is protected by an interactive Anti-Bot Human Verification check and multi-method authentication (Email OTP, Mobile SMS OTP, or Email/Password).
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works & What You Can Do Section */}
      <section id="how-it-works-section" className="py-16 md:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-1">
              What You Can Do on SafeHer
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              Explore the safety tools ready for you as soon as you sign in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Navigation className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">1. Safety-Aware Routing</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Calculate alternative routes and evaluate them by street lighting density, open shops/vendors, proximity to police checkpoints, and known danger zones.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">2. SafeCheck Guardian Timers</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Activate periodic 15, 30, or 60-minute safety check-ins. If you don't confirm "I'M SAFE" within the grace period, automated escalation triggers to your trusted contacts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">3. India Emergency SOS Dispatch</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                1-tap calling to India's 112 National Emergency Helpline, 1091 Women Helpline, and 100 Police, plus instantaneous WhatsApp and SMS broadcasts with your exact Google Maps GPS pin.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">4. Live Community Hazard Map</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                View and report poorly-lit alleys, broken streetlights, harassment hotspots, or unpaved areas verified by other women and community travelers in your city.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">5. Multi-Account Privacy</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Connect with any of your personal, work, or university email IDs or mobile phone numbers. Switch between your accounts easily without data collisions.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">6. AI Safety Insights</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Get intelligent explanations for why one route is recommended over another based on the current time of night, historical activity, and road lighting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Access Principle */}
      <section className="py-14 md:py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Our Security & Safety Principles
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">Honest, reliable safety tools without false promises.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Explainable Scoring</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every safety rating shows exactly why a route scored high or low — highlighting well-lit boulevards, isolated corridors, or active hazard reports.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Private & Secure</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your emergency contacts and private journey history are secured via Firebase Authentication and Firestore security rules.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Browser Runtime Notice</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                SafeHer is a client web app. Due to battery optimization, mobile browsers can throttle background timers if the tab is inactive for long periods. Keep the tab open for continuous SafeCheck.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <MapPin className="w-4 h-4" />
                <span>India-First Search</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Designed to recognize Indian landmarks, railway stations, metro stops, road names, and PIN codes across all Indian regions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-14 bg-slate-900 text-white text-center">
        <div className="max-w-xl mx-auto px-4 space-y-4">
          <h3 className="text-2xl font-black">Ready to travel with peace of mind?</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Sign in with any of your email accounts or mobile phone number to configure your trusted contacts and launch your first safe route.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl text-sm font-black tracking-wide shadow-xl shadow-indigo-900 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>{isLoggedIn ? 'Launch SafeHer Dashboard' : 'Sign In & Launch SafeHer'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-6 border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SafeHer — India-First Safe Navigation Platform</span>
          <span>Emergency Support: Dial 112 directly for critical assistance</span>
        </div>
      </footer>
    </div>
  );
};

