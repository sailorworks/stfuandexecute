"use client";

import { useState } from "react";
import { parseEther, formatEther } from "viem";
import { useCreateChallenge } from "@/lib/contracts/hooks/useCreateChallenge";
import { TokenType } from "@/lib/contracts/config";

interface StakeModalProps {
  challengeDbId:    string;
  goalText:         string;
  suggestedDeadline?: number; // unix seconds
  onSuccess?: (contractChallengeId: string) => void;
  onClose:    () => void;
}

const USDC_DECIMALS = 6;

export function StakeModal({
  challengeDbId,
  goalText,
  suggestedDeadline,
  onSuccess,
  onClose,
}: StakeModalProps) {
  const { createChallenge, isPending, error } = useCreateChallenge();

  const [token, setToken]       = useState<typeof TokenType[keyof typeof TokenType]>(TokenType.NATIVE);
  const [amountStr, setAmount]  = useState("");
  const [deadlineStr, setDeadline] = useState(
    suggestedDeadline
      ? new Date(suggestedDeadline * 1000).toISOString().slice(0, 16)
      : ""
  );
  const [txHash, setTxHash]     = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amountStr || !deadlineStr) return;

    const deadlineUnix = Math.floor(new Date(deadlineStr).getTime() / 1000);
    let amount: bigint;

    if (token === TokenType.NATIVE) {
      amount = parseEther(amountStr);
    } else {
      amount = BigInt(Math.round(parseFloat(amountStr) * 10 ** USDC_DECIMALS));
    }

    const result = await createChallenge({
      goalText,
      deadlineUnix,
      token,
      amount,
      challengeDbId,
    });

    if (result.contractChallengeId) {
      setTxHash(result.hash);
      setContractId(result.contractChallengeId);
      onSuccess?.(result.contractChallengeId);
    }
  }

  if (contractId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-md text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-bold text-white">Stake Locked In</h2>
          <p className="text-zinc-400 text-sm">
            Challenge #{contractId} is live on Monad. The pressure is real now.
          </p>
          {txHash && (
            <a
              href={`https://testnet.monadexplorer.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-purple-400 hover:underline"
            >
              View transaction ↗
            </a>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
          >
            Let&apos;s go
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-8 w-full max-w-md space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white">Lock Your Stake</h2>
            <p className="text-zinc-500 text-sm mt-1">Real money. Real pressure.</p>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Token selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Currency
            </label>
            <div className="flex gap-2">
              {[
                { label: "MON (native)", value: TokenType.NATIVE },
                { label: "USDC",         value: TokenType.USDC },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setToken(opt.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    token === opt.value
                      ? "border-purple-500 bg-purple-500/10 text-purple-300"
                      : "border-[#2a2a2a] text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Amount ({token === TokenType.NATIVE ? "MON" : "USDC"})
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              value={amountStr}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={token === TokenType.NATIVE ? "e.g. 0.5" : "e.g. 10"}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Deadline
            </label>
            <input
              type="datetime-local"
              required
              value={deadlineStr}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 [color-scheme:dark]"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending || !amountStr || !deadlineStr}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {isPending ? "Waiting for signature…" : "Lock it in 🔒"}
          </button>
        </form>

        <p className="text-zinc-600 text-xs text-center">
          If you fail: 5% to the protocol, rest to the prediction market winners.
        </p>
      </div>
    </div>
  );
}
