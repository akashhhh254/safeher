import React from 'react';
import { X, Calendar, MapPin, ShieldCheck, Clock, Navigation } from 'lucide-react';
import { ActiveJourney } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pastJourneys: ActiveJourney[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  pastJourneys,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Journey Logs</h2>
              <p className="text-xs text-slate-400">Past protected routes & completed safety checks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3">
          {pastJourneys.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 px-4">
              <Navigation className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No recorded journeys yet.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                When you start and complete a safe route with SafeCheck, your journey history will be securely logged here.
              </p>
            </div>
          ) : (
            pastJourneys.map((j) => (
              <div
                key={j.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{j.destinationName}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(j.startedAt).toLocaleDateString()} •{' '}
                      {new Date(j.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {j.route.safety.compositeSafetyScore}% Safety
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span>{j.route.distanceKm} km</span>
                    <span>•</span>
                    <span>{j.route.durationMinutes} mins</span>
                    <span>•</span>
                    <span className="capitalize text-indigo-600 font-bold">{j.mode} Mode</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Completed Safely
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
