"use client";

import { useState, useEffect } from "react";
import { formatEther } from "viem";
import { publicClient } from "@/lib/contracts/publicClient";
import { marketContract, TokenType } from "@/lib/contracts/config";
import { usePlaceBet } from "@/lib/contracts/hooks/usePlaceBet";
import { useClaimWinnings } from "@/lib/contracts/hooks/useClaimWinnings";
import { useSTFUWalletClient } from "@/lib/contracts/useWalletClient";

interface MarketData {
  totalPassBets: bigint;
  totalFailBets: bigint;
  slashedStake:  bigint;
  protocolFee:   bigint;
  status:        number;  // 0=Open, 1=ResolvedPass, 2=ResolvedFail
  token:         number;  // 0=NATIVE, 1=USDC
}

interface PredictionPanelProps {
  contractChallengeId: string;
  isResolved?:         boolean;
}

const STATUS_LABEL = ["Open", "✅ Challenger Passed", "❌ Challenger Failed"] as const;
const USDC_DEC = 1_000_000;

function formatAmount(amount: bigint, token: number) {
  if (token === TokenType.USDC) return `$${(Number(amount) / USDC_DEC).toFixed(2)}`;
  return `${parseFloat(formatEther(amount)).toFixed(4)} MON`;
}

function calcOdds(pass: bigint, fail: bigint) {
  const total = Number(pass + fail);
  if (total === 0) return { passOdds: 50, failOdds: 50 };
  return {
    passOdds: Math.round((Number(pass) / total) * 100),
    failOdds: Math.round((Number(fail) / total) * 100),
  };
}

export function PredictionPanel({ contractChallengeId, isResolved }: PredictionPanelProps) {
  const [market, setMarket]           = useState<MarketData | null>(null);
  const [userBets, setUserBets]       = useState<{ onPass: bigint; onFail: bigint } | null>(null);
  const [payout, setPayout]           = useState<bigint | null>(null);
  const [betSide, setBetSide]         = useState<"pass" | "fail">("pass");
  const [amountStr, setAmountStr]     = useState("");
  const [txStatus, setTxStatus]       = useState<string | null>(null);

  const { address }                   = useSTFUWalletClient();
  const { placeBet, isPending: betting } = usePlaceBet();
  const { claimWinnings, isPending: claiming } = useClaimWinnings();

  async function fetchMarketData() {
    try {
      const id = BigInt(contractChallengeId);
      const data = await publicClient.readContract({
        ...marketContract,
        functionName: "getMarket",
        args:         [id],
      }) as unknown as MarketData;
      setMarket(data);

      if (address) {
        const bets = await publicClient.readContract({
          ...marketContract,
          functionName: "getMyBets",
          args:         [id, address],
        }) as unknown as { onPass: bigint; onFail: bigint };
        setUserBets(bets);

        const p = await publicClient.readContract({
          ...marketContract,
          functionName: "calculatePayout",
          args:         [id, address],
        }) as bigint;
        setPayout(p);
      }
    } catch {
      // Contract not deployed / challenge not found
    }
  }

  useEffect(() => {
    fetchMarketData();
    if (!isResolved) {
      const interval = setInterval(fetchMarketData, 15_000);
      return () => clearInterval(interval);
    }
  }, [contractChallengeId, address, isResolved]);

  async function handleBet(e: React.FormEvent) {
    e.preventDefault();
    if (!market || !amountStr) return;
    const token = market.token as typeof TokenType[keyof typeof TokenType];
    const amount = token === TokenType.USDC
      ? BigInt(Math.round(parseFloat(amountStr) * USDC_DEC))
      : BigInt(Math.round(parseFloat(amountStr) * 1e18));

    try {
      setTxStatus("Confirm in wallet…");
      const { hash } = await placeBet({
        contractChallengeId,
        betPass: betSide === "pass",
        token,
        amount,
      });
      setTxStatus(`Bet placed! tx: ${hash.slice(0, 10)}…`);
      setAmountStr("");
      await fetchMarketData();
    } catch (err: any) {
      setTxStatus(err?.shortMessage ?? "Transaction failed");
    }
  }

  async function handleClaim() {
    try {
      setTxStatus("Confirm claim in wallet…");
      const { hash } = await claimWinnings(contractChallengeId);
      setTxStatus(`Claimed! tx: ${hash.slice(0, 10)}…`);
      await fetchMarketData();
    } catch (err: any) {
      setTxStatus(err?.shortMessage ?? "Claim failed");
    }
  }

  if (!market) {
    return (
      <div className="rounded-xl border border-[#2a2a2a] p-6 text-zinc-500 text-sm">
        Loading prediction market…
      </div>
    );
  }

  const { passOdds, failOdds } = calcOdds(market.totalPassBets, market.totalFailBets);
  const tokenLabel = market.token === TokenType.USDC ? "USDC" : "MON";
  const isOpen     = market.status === 0;
  const hasPayout  = payout !== null && payout > 0n;

  return (
    <div className="rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] p-6 space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-white">Prediction Market</h3>
        <span className={`text-xs px-2 py-1 rounded-full border ${
          isOpen ? "border-green-600 text-green-400" : "border-zinc-600 text-zinc-400"
        }`}>
          {STATUS_LABEL[market.status]}
        </span>
      </div>

      {/* Odds bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>🟢 Pass {passOdds}%</span>
          <span>🔴 Fail {failOdds}%</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex">
          <div className="bg-green-500 transition-all" style={{ width: `${passOdds}%` }} />
          <div className="bg-red-500 transition-all flex-1" />
        </div>
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{formatAmount(market.totalPassBets, market.token)} on pass</span>
          <span>{formatAmount(market.totalFailBets, market.token)} on fail</span>
        </div>
      </div>

      {/* User's existing bets */}
      {userBets && (userBets.onPass > 0n || userBets.onFail > 0n) && (
        <div className="text-xs text-zinc-400 bg-zinc-900 rounded-lg px-3 py-2 space-y-1">
          <p className="font-medium text-zinc-300">Your bets</p>
          {userBets.onPass > 0n && <p>🟢 Pass: {formatAmount(userBets.onPass, market.token)}</p>}
          {userBets.onFail > 0n && <p>🔴 Fail: {formatAmount(userBets.onFail, market.token)}</p>}
        </div>
      )}

      {/* Bet form (only when market is open) */}
      {isOpen && address && (
        <form onSubmit={handleBet} className="space-y-3">
          <div className="flex gap-2">
            {(["pass", "fail"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setBetSide(side)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                  betSide === side
                    ? side === "pass"
                      ? "border-green-500 bg-green-500/10 text-green-300"
                      : "border-red-500 bg-red-500/10 text-red-300"
                    : "border-[#2a2a2a] text-zinc-500"
                }`}
              >
                {side === "pass" ? "🟢 They'll pass" : "🔴 They'll fail"}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="number"
              step="any"
              min="0"
              required
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder={`Amount (${tokenLabel})`}
              className="flex-1 bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={betting || !amountStr}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {betting ? "…" : "Bet"}
            </button>
          </div>
        </form>
      )}

      {/* Claim winnings (post-resolution) */}
      {!isOpen && hasPayout && (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold transition-colors"
        >
          {claiming ? "Claiming…" : `Claim ${formatAmount(payout!, market.token)} 🎉`}
        </button>
      )}

      {txStatus && (
        <p className="text-xs text-zinc-400 text-center">{txStatus}</p>
      )}
    </div>
  );
}
