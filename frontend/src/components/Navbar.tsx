import React from 'react';
import { Shield, Database, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';

interface NavbarProps {
  backendOnline: boolean | null;
  artworksCount: number;
  onOpenRegister: () => void;
  onOpenDatabase: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  backendOnline,
  artworksCount,
  onOpenRegister,
  onOpenDatabase,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/[0.06] px-4 lg:px-8 py-3.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onReset}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-all">
            <div className="w-full h-full bg-[#090b12] rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-purple-300">
                GHOST ART
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                v0.5 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Artwork Provenance &amp; Visual Forensics Engine
            </p>
          </div>
        </button>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-3">
          {/* Backend Status Pill */}
          <div
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border ${
              backendOnline === true
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : backendOnline === false
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
            }`}
            title="FastAPI Backend: http://127.0.0.1:8000"
          >
            {backendOnline === true ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>API ONLINE</span>
              </>
            ) : backendOnline === false ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>API OFFLINE</span>
              </>
            ) : (
              <span>CHECKING...</span>
            )}
          </div>

          {/* Database Gallery Button */}
          <button
            onClick={onOpenDatabase}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-white/10 hover:border-cyan-500/40 transition-all shadow-sm"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Registered Archive</span>
            <span className="px-1.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 font-mono text-[11px] border border-cyan-800/50">
              {artworksCount}
            </span>
          </button>

          {/* Register Artwork Button */}
          <button
            onClick={onOpenRegister}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 hover:shadow-purple-600/40 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Register Master</span>
          </button>
        </div>
      </div>
    </header>
  );
};
