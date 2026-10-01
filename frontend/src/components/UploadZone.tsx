import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, ArrowRight, Zap, ShieldAlert } from 'lucide-react';
import type { RegisteredArtwork } from '../types/api';
import { getArtworkImageUrl } from '../services/api';

interface UploadZoneProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  onTrace: () => void;
  isTracing: boolean;
  sampleArtworks?: RegisteredArtwork[];
  onSelectSample?: (art: RegisteredArtwork) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  selectedFile,
  previewUrl,
  onFileSelect,
  onClear,
  onTrace,
  isTracing,
  sampleArtworks = [],
  onSelectSample,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setDragError(null);
    if (!file.type.startsWith('image/')) {
      setDragError('Invalid format. Please upload an image file (PNG, JPG, WEBP, GIF, BMP).');
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        /* Empty Upload Dropzone */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 md:p-12 text-center transition-all ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/20 scale-[1.01]'
              : 'border-white/10 hover:border-purple-500/40 bg-slate-900/40 hover:bg-slate-900/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-8 h-8 text-cyan-400" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                Upload Artwork to Trace Provenance
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Drag and drop your query image here, or{' '}
                <span className="text-purple-400 underline font-medium">browse files</span>. Supports PNG, JPG, WEBP, GIF, BMP.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 pt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Multi-layer SHA-256 + 64-bit pHash + Gemini 3.6 Flash</span>
            </div>
          </div>

          {dragError && (
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-lg max-w-md mx-auto">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{dragError}</span>
            </div>
          )}
        </div>
      ) : (
        /* File Preview & Actions */
        <div className="glass-panel rounded-2xl p-6 border border-purple-500/20 shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Image Preview Thumbnail */}
            <div className="relative group shrink-0">
              <div className="w-36 h-36 md:w-44 md:h-44 rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Query artwork preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-slate-600" />
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                disabled={isTracing}
                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-50"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Metadata & Trace Launch */}
            <div className="flex-1 w-full space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Query Artwork Loaded</span>
                </div>
                <h4 className="text-lg font-bold text-slate-100 truncate mt-1">
                  {selectedFile.name}
                </h4>
              </div>

              {/* File Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                  <span className="text-slate-500 block">File Size</span>
                  <span className="text-slate-200 font-semibold">{formatFileSize(selectedFile.size)}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06]">
                  <span className="text-slate-500 block">MIME Type</span>
                  <span className="text-slate-200 font-semibold truncate block">{selectedFile.type || 'image/png'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block">Target Route</span>
                  <span className="text-purple-300 font-semibold">POST /trace</span>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={onTrace}
                  disabled={isTracing}
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <Zap className="w-4 h-4 text-cyan-300 group-hover:scale-110 transition-transform" />
                  <span>{isTracing ? 'Running Forensics...' : 'Trace Artwork Provenance'}</span>
                  <ArrowRight className="w-4 h-4 text-cyan-300 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={onClear}
                  disabled={isTracing}
                  className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-mono border border-white/10 transition-all disabled:opacity-50"
                >
                  Change Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preset Demo Samples (Quick testing for hackathon judges) */}
      {sampleArtworks.length > 0 && !selectedFile && (
        <div className="mt-5 p-4 rounded-xl bg-slate-900/30 border border-white/[0.05]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Quick Demo: Test with a Registered Reference Artwork</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">1-Click Load</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sampleArtworks.slice(0, 3).map((sample) => (
              <button
                key={sample.id}
                onClick={() => onSelectSample?.(sample)}
                className="flex items-center gap-3 p-2 rounded-lg bg-black/40 hover:bg-purple-950/30 border border-white/[0.06] hover:border-purple-500/40 text-left transition-all group"
              >
                <img
                  src={getArtworkImageUrl(sample)}
                  alt={sample.title}
                  className="w-10 h-10 rounded-md object-cover bg-black border border-white/10 shrink-0"
                  onError={(e) => {
                    // Fallback placeholder if image load fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-slate-200 truncate group-hover:text-purple-300">
                    {sample.title}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    {sample.id} • {sample.creator}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
