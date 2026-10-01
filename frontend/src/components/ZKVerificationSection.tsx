import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Cpu,
  Lock,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import type { CandidateArtwork, ZKProveResponse } from '../types/api';
import { generateZKProof, verifyZKProof } from '../services/api';

interface ZKVerificationSectionProps {
  candidate: CandidateArtwork;
}

type ZKStep = 'idle' | 'generating' | 'verifying' | 'verified' | 'failed';

export const ZKVerificationSection: React.FC<ZKVerificationSectionProps> = ({ candidate }) => {
  const [step, setStep] = useState<ZKStep>('idle');
  const [proofData, setProofData] = useState<ZKProveResponse | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCommitment, setCopiedCommitment] = useState(false);

  const hasCommitment = Boolean(candidate.zk_commitment);

  const handleRunZKVerification = async () => {
    try {
      setStep('generating');
      setErrorMessage(null);
      setVerifyMessage(null);

      // Step 1: Request backend generation of Groth16 proof
      const proveResult = await generateZKProof(candidate.id);
      setProofData(proveResult);

      // Step 2: Request cryptographic verification against verification_key.json
      setStep('verifying');
      const verifyResult = await verifyZKProof(
        candidate.id,
        proveResult.proof,
        proveResult.public_signals,
        proveResult.commitment
      );

      if (verifyResult.valid) {
        setStep('verified');
        setVerifyMessage(verifyResult.message || 'Zero-knowledge proof verified');
      } else {
        setStep('failed');
        setVerifyMessage(verifyResult.message || 'Zero-knowledge proof verification failed');
      }
    } catch (err: unknown) {
      setStep('failed');
      const msg = err instanceof Error ? err.message : 'ZK operation failed';
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

  return (
    <div className="glass-panel rounded-2xl p-6 border border-purple-500/25 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Background cyber accent glow */}
      <div className="absolute top-0 right-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Lock className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-100 tracking-wide">
                Zero-Knowledge Proof Layer
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Circom 2 • Groth16 • Poseidon
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cryptographic verification of identity without revealing the private secret
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2">
          {step === 'verified' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>ZK PROOF: VERIFIED</span>
            </span>
          ) : step === 'failed' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-rose-500/15 text-rose-300 border border-rose-500/40">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>VERIFICATION FAILED</span>
            </span>
          ) : hasCommitment ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>COMMITMENT AVAILABLE</span>
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
        {/* Conceptual Educational Callout */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs text-slate-300 leading-relaxed font-sans flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-white">Conceptual distinction:</strong> Traditional SHA-256 proves exact file integrity, while pHash identifies visual similarity and Gemini provides semantic visual comparison. Our zero-knowledge layer adds privacy-preserving cryptographic verification: the claimant can prove knowledge of the secret associated with a registered artwork commitment without revealing that secret.
          </p>
        </div>

        {/* Public Commitment Card */}
        <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Public ZK Commitment (Poseidon Hash)</span>
            </span>
            <span className="text-[11px] text-slate-500">Public Signal</span>
          </div>

          <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-black/60 border border-white/[0.05] font-mono text-xs">
            <span
              className="text-cyan-300 break-all select-all font-semibold"
              title={candidate.zk_commitment || 'No commitment'}
            >
              {candidate.zk_commitment || 'No ZK commitment registered for this record'}
            </span>

            {candidate.zk_commitment && (
              <button
                onClick={handleCopyCommitment}
                className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                title="Copy commitment"
              >
                {copiedCommitment ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Formula: <code className="text-purple-300">Poseidon(fingerprint, secret) == commitment</code> (Bn128 field)
          </div>
        </div>

        {/* Verification Trigger Button & Progress */}
        {step === 'idle' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <p className="text-xs text-slate-400">
              Verify proof of ownership credentials for record <strong className="text-white">{candidate.id}</strong>.
            </p>

            <button
              onClick={handleRunZKVerification}
              disabled={!hasCommitment}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs font-mono shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4 text-cyan-300" />
              <span>Verify Zero-Knowledge Proof</span>
            </button>
          </div>
        )}

        {(step === 'generating' || step === 'verifying') && (
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2 text-center animate-pulse">
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>
                {step === 'generating'
                  ? 'Calculating witness & generating Groth16 proof (snarkjs)...'
                  : 'Verifying proof against verification key...'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Zero-knowledge circuit: ArtworkIdentity (243 non-linear constraints)
            </p>
          </div>
        )}

        {step === 'verified' && (
          <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-950/25 via-black/40 to-purple-950/20 border border-emerald-500/40 space-y-3 shadow-lg shadow-emerald-950/20 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-300 tracking-wide font-mono">
                  Zero-Knowledge Proof: VERIFIED
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Proves knowledge of the registered artwork secret without revealing the secret.
                </p>
              </div>
            </div>

            {/* Proof Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.05]">
                <span className="text-slate-500 block text-[10px] uppercase">Protocol</span>
                <span className="text-slate-200 font-semibold">Groth16 / BN128</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.05]">
                <span className="text-slate-500 block text-[10px] uppercase">Public Commitment</span>
                <span className="text-cyan-300 font-semibold truncate block" title={proofData?.commitment}>
                  {proofData?.commitment || candidate.zk_commitment}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/50 border border-white/[0.05]">
                <span className="text-slate-500 block text-[10px] uppercase">Private Witness</span>
                <span className="text-emerald-400 font-semibold">Protected (Zero Leak)</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleRunZKVerification}
                className="text-xs font-mono text-slate-400 hover:text-white underline"
              >
                Re-verify Proof
              </button>
            </div>
          </div>
        )}

        {step === 'failed' && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-300 font-mono">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Zero-Knowledge Proof: Verification Failed</span>
            </div>
            <p className="text-xs text-slate-300 font-mono">
              {errorMessage || verifyMessage || 'Proof could not be validated against the registered commitment.'}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleRunZKVerification}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition-colors"
              >
                Retry Verification
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
