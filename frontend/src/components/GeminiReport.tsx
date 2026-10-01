import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Layers, Info, ShieldCheck, Cpu } from 'lucide-react';
import type { GeminiAnalysis } from '../types/api';

interface GeminiReportProps {
  analysis: GeminiAnalysis | null;
  status: string;
}

export const GeminiReport: React.FC<GeminiReportProps> = ({ analysis, status }) => {
  const isCompleted = status.toLowerCase() === 'completed' && analysis !== null;
  const isUnavailable = status.toLowerCase().includes('unavailable') || status.toLowerCase().includes('not configured');

  return (
    <div className="glass-panel rounded-2xl p-6 border border-white/[0.08] shadow-2xl space-y-6">
      {/* Header & Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 tracking-wide">
                Gemini 3.6 Flash Visual Intelligence
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Multimodal semantic &amp; stylistic forensic comparison
            </p>
          </div>
        </div>

        {/* Gemini Status Badge */}
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>GEMINI ACTIVE • COMPLETED</span>
            </span>
          ) : isUnavailable ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>GEMINI OFFLINE / KEY NOT SET</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-500/10 text-slate-300 border border-slate-500/30">
              <Info className="w-3.5 h-3.5" />
              <span>{status}</span>
            </span>
          )}
        </div>
      </div>

      {/* Case 1: Analysis completed with rich findings */}
      {isCompleted && analysis && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/20 via-black/40 to-cyan-950/20 border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Executive Visual Summary</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {analysis.summary}
            </p>
          </div>

          {/* Similarities & Differences Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Similarities Column */}
            <div className="p-4 rounded-xl bg-black/40 border border-emerald-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Visual Similarities ({analysis.similarities?.length || 0})
                </h4>
              </div>

              {analysis.similarities && analysis.similarities.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.similarities.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-normal">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No direct visual similarities detected.</p>
              )}
            </div>

            {/* Differences Column */}
            <div className="p-4 rounded-xl bg-black/40 border border-rose-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                  Visual Differences ({analysis.differences?.length || 0})
                </h4>
              </div>

              {analysis.differences && analysis.differences.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.differences.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-normal">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No significant visual differences noted.</p>
              )}
            </div>
          </div>

          {/* Possible Modifications Detected */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                Observable Alterations / Modifications
              </h4>
            </div>

            {analysis.possible_modifications && analysis.possible_modifications.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {analysis.possible_modifications.map((mod, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-purple-950/40 text-purple-200 border border-purple-500/30 shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{mod}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                No visible alterations (cropping, recoloring, or composition modifications) detected.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Case 2: Gemini is unavailable or not configured */}
      {!isCompleted && (
        <div className="p-5 rounded-xl bg-slate-900/40 border border-white/[0.06] space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Forensic Status Note</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            {status}
          </p>
          <p className="text-xs text-slate-500">
            Perceptual hashing (pHash) and cryptographic fingerprinting remain 100% active and authoritative for candidate ranking. To enable AI multimodal narrative reports, configure <code className="px-1.5 py-0.5 rounded bg-black/60 text-purple-300 font-mono text-[11px]">GEMINI_API_KEY</code> in the backend environment.
          </p>
        </div>
      )}

      {/* Legal & Forensics Disclaimer */}
      <div className="pt-2 text-[11px] font-mono text-slate-500 border-t border-white/[0.04] flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Legal notice: Observable visual similarities are objective digital forensics and do not constitute an automated legal conclusion of copyright infringement.
        </span>
      </div>
    </div>
  );
};
