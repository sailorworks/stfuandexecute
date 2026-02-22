"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { publicClient } from "@/lib/contracts/publicClient";
import { vaultContract, TokenType } from "@/lib/contracts/config";

interface Props {
  contractChallengeId: string;
  stakeAmount?:        string; // from DB (wei / μUSDC as string)
  stakeToken?:         "native" | "usdc";
  deadline?:           Date;
}

function useCountdown(deadline?: Date) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const ms = deadline.getTime() - Date.now();
      if (ms <= 0) { setRemaining("Deadline passed"); return; }
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setRemaining(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}

const STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: "Active",  color: "text-green-400 border-green-600" },
  1: { label: "Passed ✅", color: "text-green-400 border-green-600" },
  2: { label: "Failed ❌", color: "text-red-400 border-red-600" },
  3: { label: "Expired",  color: "text-zinc-400 border-zinc-600" },
};

export function ChallengeStatusBanner({ contractChallengeId, stakeAmount, stakeToken, deadline }: Props) {
  const [onChainStatus, setOnChainStatus] = useState<number | null>(null);
  const countdown = useCountdown(deadline);

  useEffect(() => {
    if (!contractChallengeId || !process.env.NEXT_PUBLIC_VAULT_ADDRESS) return;
    publicClient.readContract({
      ...vaultContract,
      functionName: "getChallenge",
      args:         [BigInt(contractChallengeId)],
    }).then((c: any) => {
      setOnChainStatus(Number(c.status));
    }).catch(() => {});
  }, [contractChallengeId]);

  if (!contractChallengeId) return null;

  const statusInfo = onChainStatus !== null ? STATUS_MAP[onChainStatus] : null;

  function formatStake() {
    if (!stakeAmount) return null;
    if (stakeToken === "usdc") return `$${(Number(stakeAmount) / 1_000_000).toFixed(2)} USDC`;
    try { return `${parseFloat(formatEther(BigInt(stakeAmount))).toFixed(4)} MON`; } catch { return stakeAmount; }
  }

  const stakeDisplay = formatStake();

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] text-sm">
      <div className="flex items-center gap-2">
        <span className="text-zinc-500">Challenge</span>
        <span className="text-zinc-300 font-mono">#{contractChallengeId}</span>
      </div>

      {stakeDisplay && (
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">Stake:</span>
          <span className="text-white font-semibold">{stakeDisplay}</span>
        </div>
      )}

      {deadline && (
        <div className="flex items-center gap-1">
          <span className="text-zinc-500">⏰</span>
          <span className="text-zinc-300">{countdown}</span>
        </div>
      )}

      {statusInfo && (
        <span className={`ml-auto px-2 py-0.5 rounded-full border text-xs ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      )}

      <a
        href={`https://testnet.monadexplorer.com/address/${process.env.NEXT_PUBLIC_VAULT_ADDRESS}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-purple-400 hover:underline ml-auto"
      >
        View on Monad ↗
      </a>
    </div>
  );
}
