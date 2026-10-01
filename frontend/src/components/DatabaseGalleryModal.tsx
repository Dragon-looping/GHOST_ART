import React from 'react';
import { X, Database, Calendar, User, Zap } from 'lucide-react';
import type { RegisteredArtwork } from '../types/api';
import { getArtworkImageUrl } from '../services/api';

interface DatabaseGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworks: RegisteredArtwork[];
  onSelectForTrace: (artwork: RegisteredArtwork) => void;
}

export const DatabaseGalleryModal: React.FC<DatabaseGalleryModalProps> = ({
  isOpen,
  onClose,
  artworks,
  onSelectForTrace,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel-glow w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Registered Artwork Archive
              </h3>
              <p className="text-xs text-slate-400">
                Current reference records registered in the provenance database ({artworks.length})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5">
          {artworks.length === 0 ? (
            <div className="py-16 text-center">
              <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-mono">
                No artworks currently registered in the database ledger.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Click "Register Master" in the navbar to add your first reference artwork.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {artworks.map((art) => {
                const imgUrl = getArtworkImageUrl(art);
                return (
                  <div
                    key={art.id}
                    className="glass-card rounded-xl p-3.5 border border-white/[0.06] flex flex-col justify-between space-y-3"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div className="aspect-square rounded-lg overflow-hidden bg-black/60 border border-white/10 mb-3 flex items-center justify-center relative group">
                        <img
                          src={imgUrl}
                          alt={art.title}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
                          {art.id}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 truncate">
                        {art.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                        <User className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{art.creator}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/[0.05]">
                      <div className="text-[10px] font-mono text-slate-400 truncate flex items-center justify-between">
                        <span className="text-slate-500">pHash:</span>
                        <span className="text-purple-300 font-semibold">{art.phash}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate flex items-center justify-between">
                        <span className="text-slate-500">ZK Poseidon:</span>
                        <span className="text-cyan-300 font-semibold truncate max-w-[140px]" title={art.zk_commitment || 'Pending'}>
                          {art.zk_commitment ? `${art.zk_commitment.slice(0, 12)}...` : 'Pending'}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(art.created_at)}</span>
                      </div>

                      <button
                        onClick={() => {
                          onSelectForTrace(art);
                          onClose();
                        }}
                        className="w-full mt-2 py-1.5 px-3 rounded-lg bg-purple-600/30 hover:bg-purple-600/60 text-purple-200 border border-purple-500/40 text-xs font-mono flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Zap className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Trace Against This Master</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
