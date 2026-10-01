import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Hash,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import type { CandidateArtwork, TraceResponse } from '../types/api';
import { VisualComparison } from './VisualComparison';
import { GeminiReport } from './GeminiReport';
import { CandidateCard } from './CandidateCard';
import { ZKVerificationSection } from './ZKVerificationSection';

interface ResultsDashboardProps {
  traceResult: TraceResponse;
  queryPreviewUrl: string;
  queryFileName: string;
  onNewTrace: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  traceResult,
  queryPreviewUrl,
  queryFileName,
  onNewTrace,
}) => {
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);

  const candidates = traceResult.candidates || [];
  const hasCandidates = candidates.length > 0;
  const topCandidate: CandidateArtwork | undefined = candidates[selectedCandidateIndex] || candidates[0];

  // Determine overall match banner severity
  const topScore = topCandidate ? topCandidate.similarity_score : 0;

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <button
          onClick={onNewTrace}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono border border-white/10 transition-all self-start"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Upload Another Artwork</span>
        </button>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Provenance Ledger Verified</span>
          </span>
          <span className="text-slate-600">•</span>
          <span>POST /trace result</span>
        </div>
      </div>

      {/* Match Status Banner */}
      {hasCandidates ? (
        <div
          className={`glass-panel-glow rounded-2xl p-6 border relative overflow-hidden ${
            topScore >= 90
              ? 'border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-black/40 to-purple-950/20'
              : topScore >= 70
              ? 'border-cyan-500/40 bg-gradient-to-r from-cyan-950/20 via-black/40 to-purple-950/20'
              : 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-black/40 to-purple-950/20'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                  topScore >= 90
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : topScore >= 70
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {topScore >= 70 ? (
                  <ShieldCheck className="w-8 h-8" />
                ) : (
                  <ShieldAlert className="w-8 h-8" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
                      topScore >= 90
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : topScore >= 70
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {topScore >= 90
                      ? 'CRITICAL VISUAL MATCH CONFIRMED'
                      : topScore >= 70
                      ? 'HIGH PROBABILITY SIMILARITY'
                      : 'MODERATE CORRELATION'}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {candidates.length} Candidate{candidates.length === 1 ? '' : 's'} Ranked
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Matched Reference: {topCandidate.title}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Master record registered by <span className="font-semibold text-white">{topCandidate.creator}</span> ({topCandidate.id})
                </p>
              </div>
            </div>

            {/* Big Forensic Metrics Display */}
            <div className="flex items-center gap-3 sm:gap-6 self-start md:self-auto">
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400 block uppercase">
                  Similarity Score
                </span>
                <span
                  className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                    topScore >= 90
                      ? 'text-emerald-400'
                      : topScore >= 70
                      ? 'text-cyan-300'
                      : 'text-amber-400'
                  }`}
                >
                  {topScore.toFixed(1)}%
                </span>
              </div>

              <div className="h-10 w-px bg-white/10" />

              <div className="text-left">
                <span className="text-[11px] font-mono text-slate-400 block uppercase">
                  Hamming Distance
                </span>
                <span className="text-2xl sm:text-3xl font-bold font-mono text-purple-300">
                  {topCandidate.phash_distance}
                  <span className="text-xs text-slate-400 font-normal ml-1">bits</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Clean "No matching registered artwork found" state */
        <div className="glass-panel-glow rounded-2xl p-10 border border-cyan-500/20 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Search className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              No Matching Registered Artwork Found
            </h3>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
              The cryptographic SHA-256 and perceptual hash (pHash) fingerprints did not match any reference record currently stored in the provenance ledger.
            </p>
          </div>

          {/* Display query hash info */}
          <div className="p-3 rounded-xl bg-black/60 border border-white/[0.08] max-w-md mx-auto text-xs font-mono text-left space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Query Perceptual Hash (pHash):</span>
              <span className="text-cyan-300 font-bold">{traceResult.query_phash}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Database Candidates:</span>
              <span className="text-slate-300">0 matched</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onNewTrace}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs font-mono transition-all shadow-lg shadow-purple-600/30"
            >
              Trace Another Artwork
            </button>
          </div>
        </div>
      )}

      {/* Main Forensic Content (if candidates exist) */}
      {hasCandidates && topCandidate && (
        <div className="space-y-8">
          {/* Visual Comparison Section */}
          <VisualComparison
            queryPreviewUrl={queryPreviewUrl}
            candidate={topCandidate}
            queryFileName={queryFileName}
            queryPhash={traceResult.query_phash}
          />

          {/* Gemini Multimodal Analysis Section */}
          <GeminiReport
            analysis={traceResult.gemini_analysis}
            status={traceResult.gemini_status}
          />

          {/* Zero-Knowledge Proof Verification Layer */}
          <ZKVerificationSection candidate={topCandidate} />

          {/* Candidate Matches Selector (if multiple candidates) */}
          {candidates.length > 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">
                    All Candidates Ranked by Visual Similarity ({candidates.length})
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Click a candidate to compare
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((cand, idx) => (
                  <CandidateCard
                    key={cand.id}
                    candidate={cand}
                    rank={idx + 1}
                    isSelected={idx === selectedCandidateIndex}
                    onSelect={() => setSelectedCandidateIndex(idx)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Master Record Cryptographic Ledger Card */}
          <div className="glass-panel rounded-2xl p-6 border border-white/[0.06] space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <Hash className="w-4 h-4" />
              <span>Cryptographic Provenance Signatures</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
                <span className="text-slate-500 block uppercase text-[10px]">
                  Reference Artwork SHA-256 Digest
                </span>
                <span className="text-slate-200 break-all select-all font-semibold">
                  {topCandidate.sha256}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
                <span className="text-slate-500 block uppercase text-[10px]">
                  Reference Artwork pHash (64-bit DCT)
                </span>
                <span className="text-purple-300 break-all select-all font-semibold">
                  {topCandidate.phash}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
                <span className="text-slate-500 block uppercase text-[10px]">
                  ZK Commitment (Poseidon)
                </span>
                <span className="text-cyan-300 break-all select-all font-semibold">
                  {topCandidate.zk_commitment || 'Pending setup'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
