import React from 'react';
import { Users, AlertTriangle, ShieldCheck } from 'lucide-react';

interface BentoMetricsRowProps {
  contactsCount: number;
  reportsCount: number;
  isJourneyActive: boolean;
  onQuickCheckIn: () => void;
  onOpenContacts: () => void;
  onOpenReports: () => void;
}

export const BentoMetricsRow: React.FC<BentoMetricsRowProps> = ({
  contactsCount,
  reportsCount,
  isJourneyActive,
  onQuickCheckIn,
  onOpenContacts,
  onOpenReports,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mt-4 md:mt-6">
      {/* 1. Emergency Contacts Bento Card */}
      <div
        onClick={onOpenContacts}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trusted Contacts</p>
          <p className="text-base font-black text-slate-800">{contactsCount} Active</p>
        </div>
      </div>

      {/* 2. Community Hazard Reports Bento Card */}
      <div
        onClick={onOpenReports}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0 border border-amber-100">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Community Reports</p>
          <p className="text-base font-black text-slate-800">{reportsCount} Live Nearby</p>
        </div>
      </div>

      {/* 3. SafeCheck Status & Quick Action Card */}
      <div className="bg-indigo-950 p-4 rounded-2xl border border-indigo-800 shadow-md flex items-center gap-4 text-white hover:bg-indigo-900 transition-colors">
        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-300 border border-indigo-500/30 shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">SafeCheck</p>
          {isJourneyActive ? (
            <button
              onClick={onQuickCheckIn}
              className="text-sm font-black text-white underline decoration-indigo-400 underline-offset-4 cursor-pointer hover:text-indigo-200 transition-colors"
            >
              I'm Safe Now
            </button>
          ) : (
            <span className="text-sm font-bold text-indigo-100">Protection Ready</span>
          )}
        </div>
      </div>
    </div>
  );
};
