import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Cpu,
  Lock,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  Shield,
} from 'lucide-react';
import type { CandidateArtwork, ZKProveResponse } from '../types/api';
import { generateZKProof, verifyZKProof } from '../services/api';

interface ZKVerificationSectionProps {
  candidate: CandidateArtwork;
}

type ProofGenStatus = 'idle' | 'generating' | 'generated' | 'failed';
type VerificationStatus = 'idle' | 'verifying' | 'valid' | 'invalid';

export const ZKVerificationSection: React.FC<ZKVerificationSectionProps> = ({ candidate }) => {
  const [proofGenStatus, setProofGenStatus] = useState<ProofGenStatus>('idle');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [proofData, setProofData] = useState<ZKProveResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCommitment, setCopiedCommitment] = useState(false);

  const hasCommitment = Boolean(candidate.zk_commitment);

  const formatCommitment = (commitment?: string | null): string => {
    if (!commitment) return 'No commitment registered';
    if (commitment.length <= 20) return commitment;
    return `${commitment.slice(0, 12)}...${commitment.slice(-8)}`;
  };

  const handleGenerateProof = async () => {
    if (!hasCommitment) return;
    try {
      setProofGenStatus('generating');
      setErrorMessage(null);
      const proveResult = await generateZKProof(candidate.id);
      setProofData(proveResult);
      setProofGenStatus('generated');
    } catch (err: unknown) {
      setProofGenStatus('failed');
      const msg = err instanceof Error ? err.message : 'Failed to generate ZK proof';
      setErrorMessage(msg);
    }
  };

  const handleVerifyProof = async () => {
    if (!hasCommitment) return;
    try {
      setErrorMessage(null);
      let currentProof = proofData;

      // If proof has not been generated yet, generate it first
      if (!currentProof) {
        setProofGenStatus('generating');
        currentProof = await generateZKProof(candidate.id);
        setProofData(currentProof);
        setProofGenStatus('generated');
      }

      setVerificationStatus('verifying');
      const verifyResult = await verifyZKProof(
        candidate.id,
        currentProof.proof,
        currentProof.public_signals,
        currentProof.commitment
      );

      if (verifyResult.valid) {
        setVerificationStatus('valid');
      } else {
        setVerificationStatus('invalid');
        setErrorMessage(verifyResult.message || 'Verification returned invalid status');
      }
    } catch (err: unknown) {
      setVerificationStatus('invalid');
      const msg = err instanceof Error ? err.message : 'Failed to verify ZK proof';
      setErrorMessage(msg);
    }
  };

  const handleCopyCommitment = () => {
    if (candidate.zk_commitment) {
      navigator.clipboard.writeText(candidate.zk_commitment);
      setCopiedCommitment(true);
      setTimeout(() => setCopiedCommitment(false), 2000);
    }
  };

  const isBusy = proofGenStatus === 'generating' || verificationStatus === 'verifying';

  return (
    <div className="glass-panel rounded-2xl p-6 border border-purple-500/30 bg-gradient-to-b from-purple-950/20 via-black/40 to-black/60 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background cryptographic accent glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-inner">
            <Lock className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 tracking-wide">
                Zero-Knowledge Verification
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-400" />
                Privacy-Preserving Verification Layer
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs font-mono text-slate-400">
              <span>Protocol: <strong className="text-slate-200">Groth16</strong></span>
              <span className="text-slate-600">•</span>
              <span>Curve: <strong className="text-slate-200">BN128</strong></span>
            </div>
          </div>
        </div>

        {/* Global Verification Status Pill */}
        <div className="flex items-center gap-2">
          {verificationStatus === 'valid' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm shadow-emerald-500/30">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>RESULT: VALID</span>
            </span>
          ) : verificationStatus === 'invalid' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/50">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>RESULT: INVALID</span>
            </span>
          ) : hasCommitment ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>COMMITMENT READY</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-400 border border-white/10">
              <span>NO COMMITMENT</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="space-y-5 relative z-10">
        {/* Short Explanation Banner */}
        <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-slate-300 leading-relaxed font-sans flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            This proof verifies knowledge of the private credential associated with the registered commitment without revealing the credential.
          </p>
        </div>

        {/* Registered Commitment Card */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span>Registered Commitment</span>
            </span>
            <span className="text-[11px] text-slate-500">Public Signal</span>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/80 border border-white/[0.06] font-mono text-xs">
            <span
              className="text-cyan-300 font-semibold tracking-wider select-all"
              title={candidate.zk_commitment || 'No commitment registered'}
            >
              {formatCommitment(candidate.zk_commitment)}
            </span>

            {candidate.zk_commitment && (
              <button
                onClick={handleCopyCommitment}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-[11px] shrink-0"
                title="Copy full commitment"
              >
                {copiedCommitment ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Full</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Cryptographic Parameters & Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
            <span className="text-slate-500 block text-[10px] uppercase">Protocol</span>
            <span className="text-slate-200 font-semibold">Groth16</span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
            <span className="text-slate-500 block text-[10px] uppercase">Curve</span>
            <span className="text-slate-200 font-semibold">BN128</span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
            <span className="text-slate-500 block text-[10px] uppercase">Proof Status</span>
            <span
              className={`font-semibold ${
                proofGenStatus === 'generated'
                  ? 'text-emerald-400'
                  : proofGenStatus === 'generating'
                  ? 'text-cyan-400'
                  : proofGenStatus === 'failed'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {proofGenStatus === 'generating' && 'Generating...'}
              {proofGenStatus === 'generated' && 'Generated'}
              {proofGenStatus === 'failed' && 'Failed'}
              {proofGenStatus === 'idle' && 'Not Generated'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05]">
            <span className="text-slate-500 block text-[10px] uppercase">Verification</span>
            <span
              className={`font-semibold ${
                verificationStatus === 'valid'
                  ? 'text-emerald-400'
                  : verificationStatus === 'verifying'
                  ? 'text-cyan-400'
                  : verificationStatus === 'invalid'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {verificationStatus === 'verifying' && 'Verifying...'}
              {verificationStatus === 'valid' && 'VALID'}
              {verificationStatus === 'invalid' && 'INVALID'}
              {verificationStatus === 'idle' && 'Pending'}
            </span>
          </div>
        </div>

        {/* In-Progress Loading State */}
        {isBusy && (
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2 text-center animate-pulse">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-300">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>
                {verificationStatus === 'verifying'
                  ? 'Verifying cryptographic proof against registered commitment...'
                  : 'Generating Groth16 zero-knowledge proof...'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              ZK Circuit: ArtworkIdentity (Groth16 • BN128)
            </p>
          </div>
        )}

        {/* VALID Result Banner */}
        {verificationStatus === 'valid' && (
          <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/40 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-300 font-mono uppercase tracking-wide">
                  Zero-Knowledge Verification Result: VALID
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Knowledge of credential successfully verified without exposure of private data.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-xs font-bold shrink-0">
              VALID
            </span>
          </div>
        )}

        {/* INVALID / Failed Result Banner */}
        {verificationStatus === 'invalid' && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-rose-300 font-mono uppercase tracking-wide">
                  Zero-Knowledge Verification Result: INVALID
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 font-mono">
                  {errorMessage || 'Cryptographic verification failed against the registered commitment.'}
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-xs font-bold shrink-0">
              INVALID
            </span>
          </div>
        )}

        {/* Action Controls: Generate Proof & Verify Proof Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleGenerateProof}
            disabled={!hasCommitment || isBusy}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs font-semibold border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {proofGenStatus === 'generating' ? (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            ) : (
              <Cpu className="w-4 h-4 text-purple-400" />
            )}
            <span>Generate Proof</span>
          </button>

          <button
            onClick={handleVerifyProof}
            disabled={!hasCommitment || isBusy}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs font-mono shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {verificationStatus === 'verifying' ? (
              <Loader2 className="w-4 h-4 text-cyan-300 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-cyan-300" />
            )}
            <span>Verify Proof</span>
          </button>
        </div>
      </div>
    </div>
  );
};
