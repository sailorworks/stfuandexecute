"use client";

import { motion } from "framer-motion";
import { Zap, Users, Timer, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Challenge {
  contractChallengeId: string;
  goal: string;
  stakeAmount: string | null;
  stakeToken: "native" | "usdc" | null;
  deadline: Date | null;
  walletAddress: string | null;
  isResolved: boolean;
}

interface Stats {
  active: number;
  total: number;
  successRate: number;
}

function formatStake(amount: string | null, token: "native" | "usdc" | null) {
  if (!amount) return null;
  if (token === "usdc") return `$${(Number(amount) / 1_000_000).toFixed(2)} USDC`;
  // native: wei → MON
  try {
    const mon = Number(BigInt(amount)) / 1e18;
    return `${mon.toFixed(4)} MON`;
  } catch {
    return amount;
  }
}

function formatDeadline(deadline: Date | null) {
  if (!deadline) return null;
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

function shortAddress(addr: string | null) {
  if (!addr) return "anonymous";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function ArenaFeed({ challenges, stats }: { challenges: Challenge[]; stats: Stats }) {
  return (
    <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0f1011] pt-20 px-6 pb-20">
      <div className="max-w-[1400px] mx-auto">
        {/* Hero */}
        <div className="mb-12">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[10vw] md:text-[5rem] font-black leading-none tracking-brutalist uppercase mb-4"
          >
            The Arena.
          </motion.h1>
          <p className="text-xl md:text-2xl font-bold text-monad-purple dark:text-[#a099ff] uppercase tracking-tighter">
            Bet on execution. Watch them win or burn.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-monad-purple text-white rounded-2xl relative overflow-hidden group shadow-[0_0_30px_rgba(131,110,249,0.3)]">
            <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 font-mono">Active Challenges</span>
              <h2 className="text-4xl font-black mt-1">{stats.active}</h2>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/10 rounded-2xl relative overflow-hidden group">
            <Users className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 group-hover:scale-110 transition-transform dark:invert" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#999] dark:text-[#555]">Total On-Chain</span>
              <h2 className="text-4xl font-black mt-1">{stats.total}</h2>
            </div>
          </div>
          <div className="p-6 bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/10 rounded-2xl relative overflow-hidden group">
            <Zap className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 group-hover:scale-110 transition-transform dark:invert" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#999] dark:text-[#555]">Success Rate</span>
              <h2 className="text-4xl font-black mt-1">
                {stats.successRate > 0 ? `${stats.successRate}%` : "—"}
              </h2>
            </div>
          </div>
        </div>

        {/* Challenge Feed */}
        {challenges.length === 0 ? (
          <div className="text-center py-24 text-zinc-500">
            <p className="text-2xl font-black uppercase mb-2">No active challenges yet.</p>
            <p className="text-sm">Be the first to lock a stake.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {challenges.map((challenge, idx) => {
              const stake = formatStake(challenge.stakeAmount, challenge.stakeToken);
              const timeLeft = formatDeadline(challenge.deadline);

              return (
                <motion.div
                  key={challenge.contractChallengeId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className="bg-white dark:bg-[#1a1a1a] border-4 border-black dark:border-white/10 p-8 relative overflow-hidden group hover:border-monad-purple dark:hover:border-monad-purple transition-all shadow-xl hover:shadow-2xl"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-monad-purple flex items-center justify-center rotate-45 translate-x-8 -translate-y-8">
                    <Zap className="text-white -rotate-45 w-6 h-6" />
                  </div>

                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-black dark:bg-white/20 rounded-full" />
                      <span className="font-black text-sm uppercase tracking-wider font-mono">
                        {shortAddress(challenge.walletAddress)}
                      </span>
                      {challenge.isResolved ? (
                        <span className="ml-auto text-[10px] font-black px-2 py-1 bg-zinc-700 text-zinc-300 rounded uppercase">
                          Resolved
                        </span>
                      ) : (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-black px-2 py-1 bg-red-500 text-white rounded uppercase animate-pulse">
                          <span className="w-1 h-1 bg-white rounded-full" /> Live
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl md:text-3xl font-black leading-tight uppercase mb-6 group-hover:text-monad-purple transition-colors font-sans">
                      {challenge.goal}
                    </h3>

                    <div className="grid grid-cols-2 gap-4 mt-auto">
                      <div className="bg-[#f4f4f4] dark:bg-black/40 p-3 rounded-xl border border-black/5 dark:border-white/5">
                        <span className="block text-[9px] font-black text-[#999] dark:text-[#555] uppercase tracking-widest mb-1 font-mono">STAKE</span>
                        <span className="font-black text-lg font-mono">{stake ?? "—"}</span>
                      </div>
                      <div className="bg-[#f4f4f4] dark:bg-black/40 p-3 rounded-xl border border-black/5 dark:border-white/5">
                        <span className="block text-[9px] font-black text-[#999] dark:text-[#555] uppercase tracking-widest mb-1 font-mono">
                          <Timer className="inline w-3 h-3 mr-0.5" />TIME LEFT
                        </span>
                        <span className="font-black text-lg font-mono">{timeLeft ?? "—"}</span>
                      </div>
                    </div>

                    <div className="mt-8 flex items-center justify-end">
                      <Link
                        href={`/arena/${challenge.contractChallengeId}`}
                        className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-black text-xs uppercase tracking-widest hover:bg-monad-purple dark:hover:bg-monad-purple dark:hover:text-white transition-all font-mono"
                      >
                        Bet on it →
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
