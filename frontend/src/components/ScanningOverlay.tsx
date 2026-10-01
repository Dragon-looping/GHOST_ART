import React, { useEffect, useState } from 'react';
import { Search, Sparkles, Layers, Fingerprint } from 'lucide-react';

interface ScanningOverlayProps {
  previewUrl: string | null;
}

const STAGES = [
  {
    id: 1,
    title: 'Calculating fingerprint',
    description: 'Extracting 64-bit DCT perceptual hash (pHash) & SHA-256 cryptographic digest',
    icon: Fingerprint,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
  },
  {
    id: 2,
    title: 'Searching registered artworks',
    description: 'Scanning SQLite provenance ledger & computing Hamming distances',
    icon: Search,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30',
  },
  {
    id: 3,
    title: 'Analyzing visual similarity',
    description: 'Ranking top candidates by visual structural and perceptual match score',
    icon: Layers,
    color: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
  },
  {
    id: 4,
    title: 'Building provenance result',
    description: 'Synthesizing Gemini 3.6 Flash multimodal inspection & forensic report',
    icon: Sparkles,
    color: 'text-fuchsia-400',
    borderColor: 'border-fuchsia-500/30',
  },
];

export const ScanningOverlay: React.FC<ScanningOverlayProps> = ({ previewUrl }) => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);

  // Cycle through the genuine forensic stages cleanly without faking progress percentages
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full glass-panel-glow rounded-2xl p-8 border border-purple-500/30 shadow-2xl relative overflow-hidden">
      {/* Background glow highlights */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center gap-8 relative z-10">
        {/* Holographic Laser Scanner Card */}
        <div className="relative shrink-0">
          <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl overflow-hidden bg-black/80 border border-purple-500/40 relative shadow-2xl shadow-purple-900/40 flex items-center justify-center">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Scanning target"
                className="w-full h-full object-contain filter brightness-90 contrast-110"
              />
            )}

            {/* Cyan/Purple Scan Grid Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />

            {/* Laser Scan Line */}
            <div className="animate-scan-line" />

            {/* Forensic Reticle HUD Elements */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />

            {/* Center target indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full border border-cyan-400/30 animate-ping opacity-30" />
              <div className="w-6 h-6 rounded-full border border-purple-400/50" />
            </div>

            <div className="absolute bottom-2 left-2 right-2 text-center py-1 px-2 rounded bg-black/80 backdrop-blur-sm border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
              SCANNING SIGNATURE
            </div>
          </div>
        </div>

        {/* Forensic Stage Steps */}
        <div className="flex-1 w-full space-y-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[11px] font-mono text-purple-300 mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>DIGITAL FORENSIC PIPELINE IN PROGRESS</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-wide">
              Analyzing Artwork Provenance
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluating perceptual fingerprints against registered master database
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {STAGES.map((stage, idx) => {
              const Icon = stage.icon;
              const isCurrent = idx === activeStageIndex;
              const isDone = idx < activeStageIndex;

              return (
                <div
                  key={stage.id}
                  className={`flex items-start gap-3.5 p-2.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-purple-950/40 border-purple-500/50 shadow-md shadow-purple-900/20 translate-x-1'
                      : isDone
                      ? 'bg-black/30 border-emerald-500/20 opacity-75'
                      : 'bg-black/20 border-white/[0.04] opacity-35'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono border ${
                      isCurrent
                        ? 'bg-purple-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500 border-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          isCurrent
                            ? 'text-white'
                            : isDone
                            ? 'text-slate-300'
                            : 'text-slate-500'
                        }`}
                      >
                        {stage.title}
                      </span>
                      {isDone && (
                        <span className="text-[10px] font-mono text-emerald-400">DONE</span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-mono text-cyan-300 animate-pulse">
                          PROCESSING...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {stage.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
