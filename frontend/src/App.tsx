import { useEffect, useState } from 'react';
import {
  Shield,
  Sparkles,
  AlertTriangle,
  Cpu,
  Layers,
  Fingerprint,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { UploadZone } from './components/UploadZone';
import { ScanningOverlay } from './components/ScanningOverlay';
import { ResultsDashboard } from './components/ResultsDashboard';
import { RegisterModal } from './components/RegisterModal';
import { DatabaseGalleryModal } from './components/DatabaseGalleryModal';
import { checkBackendHealth, fetchArtworks, traceArtwork } from './services/api';
import type { RegisteredArtwork, TraceResponse } from './types/api';

export function App() {
  // Application State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [traceResult, setTraceResult] = useState<TraceResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // System & Backend Status
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [artworks, setArtworks] = useState<RegisteredArtwork[]>([]);

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);

  // Initial backend check & artwork database fetch
  const refreshBackendData = async () => {
    try {
      await checkBackendHealth();
      setBackendOnline(true);
      const data = await fetchArtworks();
      setArtworks(data.artworks || []);
    } catch {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    refreshBackendData();
    const interval = setInterval(refreshBackendData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle file selection from dropzone or input
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setErrorMsg(null);
    setTraceResult(null);
  };

  // Clear selected file
  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setTraceResult(null);
    setErrorMsg(null);
  };

  // Quick 1-click sample select for judges & demoing
  const handleSelectSample = async (art: RegisteredArtwork) => {
    try {
      setErrorMsg(null);
      // Fetch sample image as blob to create a real File object
      const filename = art.image_path ? art.image_path.replace(/\\/g, '/').split('/').pop() : 'sample.png';
      const sampleUrl = `http://127.0.0.1:8000/uploads/${filename}`;
      const res = await fetch(sampleUrl);
      if (!res.ok) {
        throw new Error('Could not load sample image file');
      }
      const blob = await res.blob();
      const file = new File([blob], filename || 'sample.png', { type: blob.type || 'image/png' });
      handleFileSelect(file);
    } catch (e: unknown) {
      setErrorMsg(`Failed to load sample artwork: ${e instanceof Error ? e.message : 'Network error'}`);
    }
  };

  // Main trace action: calls POST /trace with multipart field name 'file'
  const handleTrace = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select or drop an image file first.');
      return;
    }

    try {
      setIsTracing(true);
      setErrorMsg(null);

      const result = await traceArtwork(selectedFile);
      setTraceResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Trace operation failed';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setErrorMsg(
          'Cannot connect to FastAPI backend at http://127.0.0.1:8000. Please ensure the server is running with: uvicorn app.main:app --reload'
        );
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsTracing(false);
    }
  };

  // Handle newly registered artwork from modal
  const handleArtworkRegistered = (newArt: RegisteredArtwork) => {
    setArtworks((prev) => [newArt, ...prev]);
  };

  return (
    <div className="min-h-screen cyber-grid-bg text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-cyan-300">
      {/* Navigation Header */}
      <Navbar
        backendOnline={backendOnline}
        artworksCount={artworks.length}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onOpenDatabase={() => setIsDatabaseOpen(false)}
        onReset={handleClear}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8 md:py-12 space-y-10">
        {/* Error Notification Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start gap-3 shadow-xl shadow-rose-950/20">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-rose-300 block mb-0.5">Forensic Engine Notice</span>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-mono text-rose-400 hover:text-white px-2 py-1 rounded bg-rose-900/40"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Show Results Dashboard if Trace Completed */}
        {traceResult && previewUrl ? (
          <ResultsDashboard
            traceResult={traceResult}
            queryPreviewUrl={previewUrl}
            queryFileName={selectedFile?.name || 'Uploaded Artwork'}
            onNewTrace={handleClear}
          />
        ) : isTracing ? (
          /* Scanning / Loading State */
          <ScanningOverlay previewUrl={previewUrl} />
        ) : (
          /* Core Landing & Upload Workspace */
          <div className="space-y-10">
            {/* Hero Headline */}
            <div className="text-center max-w-3xl mx-auto space-y-4 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>CYBER ART PROVENANCE &amp; VISUAL FORENSICS</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400">
                Verify Artwork Authenticity with Multimodal AI
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Trace suspected artworks against registered master ledgers using dual-layer perceptual hash fingerprinting (pHash), cryptographic SHA-256 digests, and Gemini 3.6 Flash multimodal inspection.
              </p>
            </div>

            {/* Upload Area Component */}
            <div className="max-w-2xl mx-auto">
              <UploadZone
                selectedFile={selectedFile}
                previewUrl={previewUrl}
                onFileSelect={handleFileSelect}
                onClear={handleClear}
                onTrace={handleTrace}
                isTracing={isTracing}
                sampleArtworks={artworks}
                onSelectSample={handleSelectSample}
              />
            </div>

            {/* Feature Cards / Architecture Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-8 max-w-5xl mx-auto">
              <div className="glass-card rounded-2xl p-5 border border-white/[0.06] space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  Perceptual Hash Fingerprinting
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Extracts 64-bit frequency DCT perceptual hashes resilient against cropping, scaling, recoloring, and compression artifacts.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-white/[0.06] space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  Gemini 3.6 Flash Vision
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Performs deep multi-image semantic comparison to isolate modifications, stylistic deviations, and compositional alterations.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-5 border border-white/[0.06] space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  Cryptographic Provenance
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Immutable SHA-256 master signatures and timestamped ledger records providing undeniable audit trails for creators.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.06] py-6 px-4 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400 font-bold">GHOST ART</span>
            <span>— Digital Forensics &amp; Provenance Protocol</span>
          </div>
          <div>FastAPI Backend • Gemini 3.6 Flash • React + Vite + TypeScript</div>
        </div>
      </footer>

      {/* Modals */}
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleArtworkRegistered}
      />

      <DatabaseGalleryModal
        isOpen={isDatabaseOpen}
        onClose={() => setIsDatabaseOpen(false)}
        artworks={artworks}
        onSelectForTrace={handleSelectSample}
      />
    </div>
  );
}

export default App;
