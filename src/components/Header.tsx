import React from 'react';
import { ShieldCheck, AlertCircle, User, LogIn } from 'lucide-react';

interface HeaderProps {
  currentTab: 'navigate' | 'reports' | 'contacts' | 'history';
  onSelectTab: (tab: 'navigate' | 'reports' | 'contacts' | 'history') => void;
  onTriggerSOS: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
  userName?: string;
  isJourneyActive: boolean;
  onShowLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onTriggerSOS,
  onOpenProfile,
  onOpenAuth,
  isLoggedIn,
  userName,
  isJourneyActive,
  onShowLanding,
}) => {

  return (
    <header className="flex justify-between items-center bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm mb-4 md:mb-6">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100 text-white shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900">SafeHer</h1>
            {isJourneyActive && (
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                SafeCheck Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
            Navigate safely. Stay connected. Reach safely.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-2 sm:gap-6 md:gap-8">
        <button
          onClick={() => onSelectTab('navigate')}
          className={`text-xs sm:text-sm font-semibold transition-colors pb-1 ${
            currentTab === 'navigate'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Navigate
        </button>
        <button
          onClick={() => onSelectTab('reports')}
          className={`text-xs sm:text-sm font-semibold transition-colors pb-1 ${
            currentTab === 'reports'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Reports
        </button>
        <button
          onClick={() => onSelectTab('contacts')}
          className={`text-xs sm:text-sm font-semibold transition-colors pb-1 ${
            currentTab === 'contacts'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Contacts
        </button>
        <button
          onClick={() => onSelectTab('history')}
          className={`text-xs sm:text-sm font-semibold transition-colors pb-1 ${
            currentTab === 'history'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Journeys
        </button>
      </nav>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onShowLanding && (
          <button
            onClick={onShowLanding}
            className="text-xs font-bold text-slate-500 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors hidden sm:block cursor-pointer"
            title="View About SafeHer & Safety Guide"
          >
            About
          </button>
        )}

        {/* SOS Emergency Broadcast */}
        <button

          onClick={onTriggerSOS}
          className="bg-red-50 text-red-600 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Emergency SOS Broadcast (112 / Contacts)"
        >
          <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" />
          <span>SOS</span>
        </button>

        {/* User Profile or Sign In */}
        {isLoggedIn ? (
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-colors cursor-pointer border border-slate-200"
            title="View Profile & Settings"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              {userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <span className="text-xs font-bold text-slate-700 hidden md:inline-block max-w-[90px] truncate">
              {userName || 'User'}
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-indigo-200"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};
