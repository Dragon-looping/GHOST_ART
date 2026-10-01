import React, { useState } from 'react';
import { Columns, Sliders, Eye, ShieldCheck } from 'lucide-react';
import type { CandidateArtwork } from '../types/api';
import { getArtworkImageUrl } from '../services/api';

interface VisualComparisonProps {
  queryPreviewUrl: string;
  candidate: CandidateArtwork;
  queryFileName?: string;
  queryPhash?: string;
}

type ViewMode = 'side-by-side' | 'slider' | 'overlay';

export const VisualComparison: React.FC<VisualComparisonProps> = ({
  queryPreviewUrl,
  candidate,
  queryFileName = 'Suspected Image',
  queryPhash = 'N/A',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(50);

  const candidateImageUrl = getArtworkImageUrl(candidate);

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] shadow-2xl space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <h3 className="text-base font-bold text-slate-100 tracking-wide">
              Visual Forensics Inspection
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare suspected query against reference master record ({candidate.id})
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('side-by-side')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            onClick={() => setViewMode('slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'slider'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            onClick={() => setViewMode('overlay')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'overlay'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Overlay Diff</span>
          </button>
        </div>
      </div>

      {/* Main Comparison Area */}
      {viewMode === 'side-by-side' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Query Artwork (Suspected) */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  QUERY ARTWORK
                </span>
                <span className="text-xs text-slate-400 truncate max-w-[180px]">
                  {queryFileName}
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">SUSPECTED</span>
            </div>

            <div className="relative aspect-square rounded-xl overflow-hidden bg-black/80 border border-amber-500/30 flex items-center justify-center p-3 group">
              <img
                src={queryPreviewUrl}
                alt="Query Artwork"
                className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-slate-300">
                Uploaded Sample
              </div>
            </div>

            {/* Query Footprint Info */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>Query pHash:</span>
                <span className="text-cyan-400 font-semibold truncate max-w-[200px]" title={queryPhash}>
                  {queryPhash}
                </span>
              </div>
            </div>
          </div>

          {/* Registered Artwork (Reference Master) */}
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  REGISTERED ARTWORK
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {candidate.id}
                </span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">MASTER REF</span>
            </div>

            <div className="relative aspect-square rounded-xl overflow-hidden bg-black/80 border border-cyan-500/30 flex items-center justify-center p-3 group">
              <img
                src={candidateImageUrl}
                alt="Registered Artwork Reference"
                className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.img-fallback') as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="img-fallback hidden flex-col items-center justify-center p-4 text-center">
                <ShieldCheck className="w-10 h-10 text-cyan-400 mb-2 opacity-50" />
                <span className="text-xs text-slate-400">Master Record: {candidate.id}</span>
              </div>

              <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/80 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
                ID: {candidate.id}
              </div>
              <div className="absolute top-2 right-2 px-2 py-1 rounded bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold">
                {candidate.similarity_score.toFixed(1)}% Match
              </div>
            </div>

            {/* Candidate Specs Info */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>Ref pHash:</span>
                <span className="text-purple-300 font-semibold truncate max-w-[200px]" title={candidate.phash}>
                  {candidate.phash}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Split Slider Sweep Mode */}
      {viewMode === 'slider' && (
        <div className="space-y-4">
          <div className="relative aspect-[16/10] sm:aspect-[16/9] max-h-[500px] w-full rounded-xl overflow-hidden bg-black select-none border border-purple-500/30">
            {/* Background Image: Registered Candidate */}
            <img
              src={candidateImageUrl}
              alt="Registered Master"
              className="absolute inset-0 w-full h-full object-contain"
            />
            <div className="absolute top-3 right-3 px-2 py-1 rounded bg-black/80 backdrop-blur-md border border-cyan-500/30 text-[10px] font-mono text-cyan-300 z-10">
              REGISTERED REFERENCE: {candidate.id}
            </div>

            {/* Foreground Clipped Image: Query Artwork */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={queryPreviewUrl}
                alt="Query Artwork"
                className="absolute inset-0 w-full h-full object-contain max-w-none"
                style={{ width: '100%', height: '100%' }}
              />
              <div className="absolute top-3 left-3 px-2 py-1 rounded bg-black/80 backdrop-blur-md border border-amber-500/30 text-[10px] font-mono text-amber-300 z-10">
                QUERY: {queryFileName}
              </div>
            </div>

            {/* Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-white to-purple-500 shadow-lg shadow-cyan-400 z-20 pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 text-xs shadow-xl">
                ⇄
              </div>
            </div>
          </div>

          {/* Slider Controller */}
          <div className="flex items-center gap-4 px-2">
            <span className="text-xs font-mono text-amber-300 shrink-0">Query (Suspected)</span>
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <span className="text-xs font-mono text-cyan-300 shrink-0">Registered (Master)</span>
          </div>
        </div>
      )}

      {/* Overlay Diff Mode */}
      {viewMode === 'overlay' && (
        <div className="space-y-4">
          <div className="relative aspect-[16/10] sm:aspect-[16/9] max-h-[500px] w-full rounded-xl overflow-hidden bg-black flex items-center justify-center border border-cyan-500/30">
            {/* Base Image */}
            <img
              src={candidateImageUrl}
              alt="Registered Reference"
              className="absolute inset-0 w-full h-full object-contain"
            />

            {/* Translucent Overlaid Query Image */}
            <img
              src={queryPreviewUrl}
              alt="Query Artwork Overlay"
              className="absolute inset-0 w-full h-full object-contain mix-blend-screen"
              style={{ opacity: overlayOpacity / 100 }}
            />

            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-xs font-mono text-slate-300">
              Screen Diff Blend Mode • Opacity: {overlayOpacity}%
            </div>
          </div>

          <div className="flex items-center gap-4 px-2">
            <span className="text-xs font-mono text-slate-400 shrink-0">Overlay Blend:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-xs font-mono text-cyan-400 font-bold shrink-0">{overlayOpacity}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
