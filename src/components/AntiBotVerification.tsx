import React, { useState } from 'react';
import { ShieldCheck, Check, Loader2, Lock, AlertTriangle } from 'lucide-react';

interface AntiBotVerificationProps {
  isVerified: boolean;
  onVerify: (token: string) => void;
  error?: string | null;
}

export const AntiBotVerification: React.FC<AntiBotVerificationProps> = ({
  isVerified,
  onVerify,
  error,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const handleCheckboxClick = () => {
    if (isVerified || isChecking) return;
    setIsChecking(true);

    // Simulate realistic behavioral heuristic check
    setTimeout(() => {
      const generatedToken = `SH-SEC-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setToken(generatedToken);
      setIsChecking(false);
      onVerify(generatedToken);
    }, 700);
  };

  return (
    <div className="space-y-1.5">
      <div
        onClick={handleCheckboxClick}
        className={`w-full p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between ${
          isVerified
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-sm'
            : error
            ? 'bg-rose-50/80 border-rose-300 text-rose-900'
            : 'bg-slate-50 hover:bg-slate-100/90 border-slate-300 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Checkbox Box */}
          <div
            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all ${
              isVerified
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : isChecking
                ? 'bg-indigo-50 border-indigo-400'
                : 'bg-white border-slate-400 hover:border-indigo-600'
            }`}
          >
            {isVerified ? (
              <Check className="w-4 h-4 stroke-[3]" />
            ) : isChecking ? (
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            ) : null}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {isVerified ? 'Human Verification Passed' : 'I am not a robot'}
              </span>
              {isVerified && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                  SECURE
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              {isVerified
                ? `Presence token: ${token}`
                : 'SafeHer Automated Bot Protection'}
            </p>
          </div>
        </div>

        {/* Brand Shield Badge */}
        <div className="flex flex-col items-end text-right pl-2 shrink-0">
          <div className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              Anti-Bot Shield
            </span>
          </div>
          <span className="text-[9px] text-slate-400">Privacy & Safety</span>
        </div>
      </div>

      {error && !isVerified && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold px-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
