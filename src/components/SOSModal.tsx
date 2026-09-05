import React, { useState } from 'react';
import { Phone, MessageSquare, ShieldAlert, Volume2, VolumeX, X, Share2, ExternalLink, AlertTriangle } from 'lucide-react';
import { EmergencyContact } from '../types';
import { sound } from '../services/audio';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: [number, number];
  contacts: EmergencyContact[];
  destinationName?: string;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  contacts,
  destinationName,
}) => {
  const [isSirenPlaying, setIsSirenPlaying] = useState(false);
  const [sirenIntervalId, setSirenIntervalId] = useState<number | null>(null);

  if (!isOpen) return null;

  const [lat, lng] = userLocation;
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  const timeStr = new Date().toLocaleTimeString();

  const emergencyMessage = `🚨 SAFEHER EMERGENCY ALERT (INDIA) 🚨\nI may need urgent assistance!\n\n📍 My current GPS location: ${mapsLink} (${lat.toFixed(5)}, ${lng.toFixed(5)})\n⏱ Time: ${timeStr}\n🎯 Destination: ${destinationName || 'Traveling'}\n\nPlease check in on me immediately or dial 112 if you cannot reach me.`;

  const primaryContact = contacts.find((c) => c.isPrimary) || contacts[0];

  const handleToggleSiren = () => {
    if (isSirenPlaying) {
      if (sirenIntervalId) clearInterval(sirenIntervalId);
      setIsSirenPlaying(false);
      setSirenIntervalId(null);
    } else {
      sound.playSOSSiren();
      const id = window.setInterval(() => {
        sound.playSOSSiren();
      }, 950);
      setSirenIntervalId(id);
      setIsSirenPlaying(true);
    }
  };

  const handleClose = () => {
    if (sirenIntervalId) clearInterval(sirenIntervalId);
    setIsSirenPlaying(false);
    onClose();
  };

  // WhatsApp Pre-filled link
  const waPhone = primaryContact?.phone ? primaryContact.phone.replace(/[^0-9]/g, '') : '';
  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(emergencyMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(emergencyMessage)}`;

  // SMS Pre-filled link
  const smsUrl = `sms:${primaryContact?.phone || ''}?body=${encodeURIComponent(emergencyMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl border-2 border-red-500 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Banner */}
        <div className="bg-red-600 p-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Emergency SOS (India)</h2>
              <p className="text-xs text-red-100 font-medium">1-Tap Authorities Dialing & Contact Alert</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-red-700/60 flex items-center justify-center text-white hover:bg-red-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Transparent Notice */}
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              SafeHer provides direct 1-tap dialing to emergency services and message dispatch to your contacts. SafeHer does not claim to automatically dispatch police.
            </p>
          </div>

          {/* Audio Siren Control */}
          <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isSirenPlaying ? 'bg-red-600 text-white animate-bounce' : 'bg-red-100 text-red-700'
                }`}
              >
                {isSirenPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-bold text-red-900 uppercase">Emergency Audible Alarm</p>
                <p className="text-[11px] text-red-700">High-pitched distress signal to deter threats</p>
              </div>
            </div>
            <button
              onClick={handleToggleSiren}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isSirenPlaying
                  ? 'bg-slate-900 text-white'
                  : 'bg-red-600 text-white shadow-md shadow-red-200 hover:bg-red-700'
              }`}
            >
              {isSirenPlaying ? 'Stop Siren' : 'Play Siren'}
            </button>
          </div>

          {/* Indian Emergency Hotlines Dialers */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Official Indian Emergency Hotlines (Toll-Free)
            </label>

            {/* 112 National Emergency */}
            <a
              href="tel:112"
              className="w-full bg-red-600 text-white p-3 rounded-xl font-bold text-xs shadow-md hover:bg-red-700 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4" />
                <span>Call 112 (National Emergency Support / ERSS)</span>
              </div>
              <span className="text-[10px] bg-red-800 px-2 py-0.5 rounded font-black">24x7</span>
            </a>

            {/* 1091 Women Helpline */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href="tel:1091"
                className="bg-indigo-600 text-white p-3 rounded-xl font-bold text-xs shadow-sm hover:bg-indigo-700 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>Call 1091 (Women Helpline)</span>
                </div>
              </a>

              <a
                href="tel:100"
                className="bg-slate-800 text-white p-3 rounded-xl font-bold text-xs shadow-sm hover:bg-slate-900 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>Call 100 (Police)</span>
                </div>
              </a>
            </div>
          </div>

          {/* Quick Dispatch to Trusted Contacts */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
              Alert Trusted Contacts with Live GPS
            </label>

            {/* WhatsApp Link */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 text-white p-3 rounded-xl font-bold text-xs shadow-md shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>Send WhatsApp SOS with Live Coordinates</span>
              </div>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>

            {/* Native SMS Link */}
            <a
              href={smsUrl}
              className="w-full bg-slate-900 text-white p-3 rounded-xl font-bold text-xs shadow-md hover:bg-slate-800 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-4 h-4" />
                <span>Send SMS to Primary Contact</span>
              </div>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>
          </div>

          {/* Current GPS Information */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <p className="text-[10px] font-bold uppercase text-slate-400">Current GPS Coordinates</p>
            <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
              Lat: {lat.toFixed(5)}, Lng: {lng.toFixed(5)}
            </p>
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-indigo-600 underline font-semibold mt-1 inline-block"
            >
              Open Live Pin in Google Maps
            </a>
          </div>

          {/* Trusted Contacts in recipient list */}
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">
              Registered Emergency Contacts ({contacts.length})
            </p>
            {contacts.length === 0 ? (
              <p className="text-xs text-amber-700 italic bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                No contacts registered yet. Open the Contacts tab to add trusted friends or family.
              </p>
            ) : (
              <div className="space-y-1.5">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-200 text-xs"
                  >
                    <div>
                      <strong className="text-slate-800">{contact.name}</strong>{' '}
                      <span className="text-slate-400">({contact.relationship})</span>
                      {contact.isPrimary && (
                        <span className="ml-1 text-[9px] bg-emerald-100 text-emerald-700 px-1 py-0.2 rounded uppercase font-bold">
                          Primary
                        </span>
                      )}
                    </div>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-indigo-600 font-bold flex items-center gap-1 hover:underline"
                    >
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
          >
            Close SOS Window
          </button>
        </div>
      </div>
    </div>
  );
};
