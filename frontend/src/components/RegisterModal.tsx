import React, { useRef, useState } from 'react';
import { X, UploadCloud, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { registerArtwork } from '../services/api';
import type { RegisteredArtwork } from '../types/api';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newArtwork: RegisteredArtwork) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [creator, setCreator] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an artwork image file to register.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const res = await registerArtwork(file, title, creator);
      setSuccessMsg(`Artwork ${res.artwork.id} ("${res.artwork.title}") registered successfully!`);
      setTimeout(() => {
        onSuccess(res.artwork);
        onClose();
        setFile(null);
        setPreview(null);
        setTitle('');
        setCreator('');
        setSuccessMsg(null);
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="glass-panel-glow w-full max-w-lg rounded-2xl p-6 border border-purple-500/30 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <PlusCircle className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">
              Register Reference Artwork
            </h3>
            <p className="text-xs text-slate-400">
              Compute hashes and store reference record in SQLite
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Selector */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Artwork File (PNG, JPG, WEBP)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-white/10 hover:border-purple-500/40 rounded-xl p-4 text-center bg-black/40 hover:bg-black/60 transition-all flex flex-col items-center justify-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
                onChange={handleFileChange}
                className="hidden"
              />
              {preview ? (
                <div className="flex items-center gap-3">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-contain bg-black border border-white/10"
                  />
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-200 block truncate max-w-[240px]">
                      {file?.name}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400">
                      Click to change image
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <UploadCloud className="w-8 h-8 text-slate-500 mb-1" />
                  <span className="text-xs text-slate-300 font-medium">
                    Click to select master artwork image
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                    POST /register
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Artwork Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Starry Night Cyberpunk"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Creator */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
              Creator / Artist Name
            </label>
            <input
              type="text"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              placeholder="e.g. Studio Ghost / Anonymous"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-slate-200 text-sm focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !file}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Artwork to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
