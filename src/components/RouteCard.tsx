import React from 'react';
import { RouteAlternative } from '../types';
import { Sparkles, ShieldCheck, AlertTriangle } from 'lucide-react';

interface RouteCardProps {
  route: RouteAlternative;
  isSelected: boolean;
  onSelect: () => void;
}

export const RouteCard: React.FC<RouteCardProps> = ({ route, isSelected, onSelect }) => {
  const score = route.safety.compositeSafetyScore;
  const isHigh = score >= 80;
  const isModerate = score >= 65 && score < 80;

  const scoreColor = isHigh
    ? 'text-emerald-600'
    : isModerate
    ? 'text-indigo-600'
    : 'text-amber-600';

  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl transition-all cursor-pointer relative ${
        isSelected
          ? 'bg-white p-4 border-2 border-indigo-500 shadow-md ring-2 ring-indigo-100'
          : 'bg-white p-4 border border-slate-200 opacity-85 hover:opacity-100 hover:border-slate-300 shadow-sm'
      }`}
    >
      {route.isRecommended && (
        <span className="absolute -top-2.5 right-4 bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
          Recommended
        </span>
      )}

      <div className="flex justify-between items-start mb-2">
        <div className="pr-2">
          <h3 className="font-bold text-slate-800 text-sm md:text-base leading-snug">{route.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {route.durationMinutes} min • {route.distanceKm} km
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className={`font-black text-lg leading-none ${scoreColor}`}>{score}%</div>
          <div className="text-[9px] uppercase font-bold text-slate-400 mt-0.5">Safety Score</div>
        </div>
      </div>

      {/* AI or Grounded Briefing */}
      {route.aiExplanation ? (
        <div className="bg-indigo-50 p-2.5 rounded-xl text-[11px] text-indigo-800 leading-relaxed mb-3 border border-indigo-100 italic flex items-start gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
          <span>"{route.aiExplanation}" — Gemini AI</span>
        </div>
      ) : (
        <div className="bg-slate-50 p-2 rounded-xl text-[11px] text-slate-600 leading-relaxed mb-3 border border-slate-100 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Deterministic Rating: {route.safety.riskLevel.toUpperCase()} Risk</span>
        </div>
      )}

      {/* Badges / Factors */}
      <div className="flex flex-wrap gap-1.5">
        {route.safety.positiveFactors.map((factor, i) => (
          <span
            key={i}
            className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-emerald-100"
          >
            {factor}
          </span>
        ))}
        {route.safety.riskFactors.map((factor, i) => (
          <span
            key={i}
            className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-amber-100 flex items-center gap-1"
          >
            <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
            {factor}
          </span>
        ))}
      </div>
    </div>
  );
};
