import React from 'react';
import { User, Mail, Shield, AlertTriangle, LogOut, X, PhoneCall, CheckCircle } from 'lucide-react';
import { auth } from '../services/firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignOut,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">User Account</h2>
              <p className="text-xs text-slate-400">Security preferences & profile status</p>
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
        <div className="p-5 overflow-y-auto space-y-4">
          {/* User Details */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <User className="w-4 h-4 text-indigo-600" />
              <span>{user?.displayName || 'Registered User'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user?.email || 'No email attached'}</span>
            </div>
            <div className="pt-2 flex items-center gap-2 text-[11px] text-emerald-700 font-semibold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Firebase Session</span>
            </div>
          </div>

          {/* India Emergency Hotlines */}
          <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 space-y-2">
            <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
              Official India Emergency Directory
            </span>
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded-xl border border-indigo-100">
                <p className="text-xs font-black text-slate-900">112</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">All Emergency</p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-indigo-100">
                <p className="text-xs font-black text-slate-900">1091</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Women Helpline</p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-indigo-100">
                <p className="text-xs font-black text-slate-900">100</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Police Support</p>
              </div>
            </div>
          </div>

          {/* Transparent Browser Limitations Notice */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Browser Runtime Notice</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              SafeHer is a client web application. Due to operating system battery optimizations, mobile browsers may throttle or pause background timers if you switch apps or lock your phone for prolonged periods. For continuous SafeCheck reminders, keep this browser tab active.
            </p>
          </div>

          {/* Sign Out Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="w-full bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out from SafeHer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
