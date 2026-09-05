import React, { useState } from 'react';
import { X, AlertTriangle, MapPin, Send, MessageSquare } from 'lucide-react';
import { CommunityReport, ReportCategory } from '../types';

interface CommunityReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: [number, number];
  onSubmitReport: (report: Omit<CommunityReport, 'id' | 'createdAt' | 'upvotes' | 'status'>) => void;
  isLoggedIn: boolean;
  onPromptLogin?: () => void;
}

export const CommunityReportModal: React.FC<CommunityReportModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  onSubmitReport,
  isLoggedIn,
  onPromptLogin,
}) => {
  const [category, setCategory] = useState<ReportCategory>('poor_lighting');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const categories: { id: ReportCategory; label: string; icon: string }[] = [
    { id: 'poor_lighting', label: 'Poor Lighting', icon: '💡' },
    { id: 'harassment', label: 'Harassment / Eve-teasing', icon: '⚠️' },
    { id: 'isolated_area', label: 'Isolated / Desolate Area', icon: '🏚️' },
    { id: 'suspicious_activity', label: 'Suspicious Loitering', icon: '👁️' },
    { id: 'road_issue', label: 'Road Obstacle / Construction', icon: '🚧' },
    { id: 'stray_animals', label: 'Aggressive Stray Animals', icon: '🐕' },
    { id: 'other', label: 'Other Safety Hazard', icon: '🛡️' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    onSubmitReport({
      category,
      title: title.trim(),
      description: description.trim(),
      location: userLocation,
      address: `Geo-tagged at (${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)})`,
    });

    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Report Safety Concern</h2>
              <p className="text-xs text-slate-400">Help protect fellow women traveling this route</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {!isLoggedIn && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
              <span>Sign in to link verified reports with your account.</span>
              {onPromptLogin && (
                <button
                  type="button"
                  onClick={onPromptLogin}
                  className="text-xs font-bold text-indigo-600 underline ml-2 shrink-0"
                >
                  Sign In
                </button>
              )}
            </div>
          )}

          {/* Location notice */}
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Pin will be placed at your active coordinates ({userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)})</span>
          </div>

          {/* Category selection */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">
              Select Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 text-left transition-all ${
                    category === c.id
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-700 ring-1 ring-indigo-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base">{c.icon}</span>
                  <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Report Title */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Hazard / Concern Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Non-working streetlights on metro exit road"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Detailed Description
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain the hazard, lighting conditions, or environmental factors observed..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl text-xs font-black tracking-wider uppercase shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Publish Community Report</span>
          </button>
        </form>
      </div>
    </div>
  );
};
