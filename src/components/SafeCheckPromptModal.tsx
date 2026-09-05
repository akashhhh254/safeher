import React, { useEffect } from 'react';
import { ShieldCheck, AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import { sound } from '../services/audio';

interface SafeCheckPromptModalProps {
  isOpen: boolean;
  onConfirmSafe: () => void;
  onTriggerSOS: () => void;
  graceSecondsRemaining: number;
}

export const SafeCheckPromptModal: React.FC<SafeCheckPromptModalProps> = ({
  isOpen,
  onConfirmSafe,
  onTriggerSOS,
  graceSecondsRemaining,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playSafeCheckReminder();
      // Vibrate mobile device if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(graceSecondsRemaining / 60);
  const seconds = graceSecondsRemaining % 60;
  const isUrgent = graceSecondsRemaining < 45;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl border-2 border-indigo-500 shadow-2xl p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto border-4 border-indigo-100 animate-bounce">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">SafeCheck Routine</h2>
          <p className="text-xs text-slate-500 mt-1">
            Please confirm your safety status to continue your protected journey.
          </p>
        </div>

        {/* Grace Period Timer */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-center gap-2 ${
            isUrgent ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4 animate-spin" />
          <span className="text-xs font-bold">
            Escalation grace: <strong className="font-mono text-sm">{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</strong>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => {
              sound.playSafeConfirmed();
              onConfirmSafe();
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl text-sm font-black tracking-wide shadow-lg shadow-emerald-200 transition-all cursor-pointer active:scale-98"
          >
            I'M SAFE
          </button>

          <button
            onClick={onTriggerSOS}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>Need Help? Trigger SOS</span>
          </button>
        </div>

        {/* Browser limitation note */}
        <p className="text-[10px] text-slate-400 leading-tight">
          Keep this web browser tab open while traveling to maintain continuous SafeCheck reminders.
        </p>
      </div>
    </div>
  );
};
