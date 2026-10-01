import React from 'react';
import { Calendar, User, CheckCircle } from 'lucide-react';
import type { CandidateArtwork } from '../types/api';

interface CandidateCardProps {
  candidate: CandidateArtwork;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  rank,
  isSelected,
  onSelect,
}) => {
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getMatchBadge = (score: number) => {
    if (score >= 95) {
      return {
        text: 'CRITICAL MATCH',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      };
    }
    if (score >= 75) {
      return {
        text: 'HIGH SIMILARITY',
        bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      };
    }
    if (score >= 50) {
      return {
        text: 'MODERATE SIMILARITY',
        bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      };
    }
    return {
      text: 'LOW SIMILARITY',
      bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    };
  };

  const badge = getMatchBadge(candidate.similarity_score);

  return (
    <div
      onClick={onSelect}
      className={`glass-panel cursor-pointer rounded-xl p-4 transition-all border ${
        isSelected
          ? 'border-purple-500/60 bg-purple-950/20 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/30'
          : 'border-white/[0.06] hover:border-white/20 bg-slate-900/40'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-mono font-bold flex items-center justify-center border border-purple-500/30">
            #{rank}
          </span>
          <span className="font-mono text-xs font-bold text-cyan-400">
            {candidate.id}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {candidate.zk_commitment && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30"
              title="ZK Commitment Available"
            >
              ZK
            </span>
          )}
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badge.bg}`}>
            {badge.text}
          </span>
        </div>
      </div>

      <div className="space-y-1 mb-3">
        <h4 className="text-sm font-semibold text-slate-100 truncate">
          {candidate.title}
        </h4>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <User className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">{candidate.creator}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-black/40 border border-white/[0.04] text-xs font-mono mb-2.5">
        <div>
          <span className="text-[10px] text-slate-500 block">Similarity</span>
          <span className="text-cyan-300 font-bold text-sm">
            {candidate.similarity_score.toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">pHash Dist</span>
          <span className="text-purple-300 font-bold text-sm">
            {candidate.phash_distance} bit{candidate.phash_distance === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(candidate.created_at)}</span>
        </span>
        {isSelected && (
          <span className="text-purple-400 font-semibold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            <span>Viewing</span>
          </span>
        )}
      </div>
    </div>
  );
};
