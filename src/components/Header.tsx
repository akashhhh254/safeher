import React from 'react';
import { ShieldCheck, AlertCircle, PhoneCall, User } from 'lucide-react';

interface HeaderProps {
  currentTab: 'navigate' | 'reports' | 'contacts' | 'history';
  onSelectTab: (tab: 'navigate' | 'reports' | 'contacts' | 'history') => void;
  onTriggerSOS: () => void;
  activeJourneyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onTriggerSOS,
  activeJourneyCount
}) => {
  return (
    <header className="flex justify-between items-center bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm mb-4 md:mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100 text-white shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">SafeHer</h1>
            {activeJourneyCount > 0 && (
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                SafeCheck Active
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Navigate Safely. Stay Connected.
          </p>
        </div>
      </div>

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
          History
        </button>
      </nav>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={onTriggerSOS}
          className="bg-red-50 text-red-600 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          title="Emergency SOS Broadcast"
        >
          <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" />
          <span>SOS</span>
        </button>

        <div
          className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-600 font-bold text-xs"
          title="User Account"
        >
          <img
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=SafeHerUser"
            alt="User profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};
