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
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLearnMore, onSignIn }) => {
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
                India-First Safety
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={scrollToFeatures}
              className="text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors hidden sm:block cursor-pointer"
            >
              How It Works
            </button>
            {onSignIn && (
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
              <span>Get Started</span>
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
            <span>Safety-Aware Web Navigation for Women in India</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 max-w-4xl mx-auto leading-[1.15]">
            Navigate safely. <br className="hidden sm:inline" />
            Stay connected. Reach safely.
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            SafeHer helps you evaluate travel routes using real street lighting, public activity, and community safety reports — keeping your trusted contacts connected throughout your journey.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-base font-black tracking-wide shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Start Safe Journey</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={scrollToFeatures}
              className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-6 py-4 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Learn How It Works</span>
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
              <p className="text-sm font-black text-slate-900 mt-0.5">Explainable Scoring</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400">Active Guardian</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">SafeCheck Timers</p>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-[10px] font-bold uppercase text-slate-400">Crowdsourced</p>
              <p className="text-sm font-black text-slate-900 mt-0.5">Live Hazard Reports</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works-section" className="py-16 md:py-24 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Designed for Real-World Travel in India
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3">
              Whether walking from a metro station at dusk or traveling home late, SafeHer prioritizes security over mere distance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Navigation className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">1. Safety-Aware Routing</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Rather than forcing you through the darkest direct alley, SafeHer evaluates public thoroughfares, commercial activity, verified emergency facilities, and street lighting.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">2. SafeCheck Routine</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Set regular 15, 30, or 60-minute safety check-ins. If you don't confirm "I'M SAFE" within the grace period, an instant alert state triggers with 1-tap contact dispatch.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">3. India Emergency Support</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Direct integration with India's 112 National Emergency Response, Women Helpline (1091), Police (100), plus 1-tap WhatsApp and SMS broadcasts with your exact GPS pin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Transparent Safety Philosophy */}
      <section className="py-14 md:py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Our Safety & Data Principles
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">Honest, reliable safety tools without false promises.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Explainable Scoring</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every safety rating shows exactly why a route scored high or low — highlighting well-lit boulevards, isolated corridors, or active hazard reports.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Private & Secure</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your emergency contacts and private journey history are secured via Firebase Authentication and Firestore security rules.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Honest Web Limitations</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                We clearly communicate that browser web applications cannot guarantee background timers if your browser is force closed or device powered off.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <MapPin className="w-4 h-4" />
                <span>India-First Search</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Designed to recognize Indian landmarks, railway stations, metro stops, road names, and PIN codes from Nagpur to Mumbai to Delhi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 bg-slate-900 text-white text-center">
        <div className="max-w-xl mx-auto px-4 space-y-4">
          <h3 className="text-2xl font-black">Ready to travel with peace of mind?</h3>
          <p className="text-xs sm:text-sm text-slate-300">
            Sign in with Firebase to configure your trusted contacts and start your first safe route.
          </p>
          <button
            onClick={onGetStarted}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl text-sm font-black tracking-wide shadow-xl shadow-indigo-900 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Launch SafeHer</span>
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
