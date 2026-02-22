"use client";

import { motion } from "framer-motion";
import { Trophy, ArrowUpRight, Medal, Skull } from "lucide-react";

const TOP_EXECUTORS = [
    { id: "1", user: "Zack_Execution", score: 980, winRate: "95%", totalWon: "$12.5k", status: "god-tier" },
    { id: "2", user: "Sarah_Ships", score: 940, winRate: "92%", totalWon: "$8.2k", status: "executor" },
    { id: "3", user: "BuildFast_0x", score: 890, winRate: "88%", totalWon: "$5.1k", status: "executor" },
    { id: "4", user: "NoExcuses_Dev", score: 850, winRate: "85%", totalWon: "$4.8k", status: "executor" },
    { id: "5", user: "Slacker_Fixed", score: 720, winRate: "70%", totalWon: "$1.2k", status: "rising" },
    { id: "6", user: "Late_Night_Coder", score: 680, winRate: "65%", totalWon: "$900", status: "rising" },
    { id: "7", user: "Burnout_Survivor", score: 400, winRate: "45%", totalWon: "$200", status: "burn-out" },
];

export default function LeaderboardPage() {
    return (
        <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0f1011] pt-20 px-6 pb-20">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[10vw] md:text-[5.5rem] font-black leading-none tracking-brutalist uppercase"
                        >
                            The Board.
                        </motion.h1>
                        <p className="text-xl font-bold text-[#999] dark:text-[#555] uppercase tracking-tighter mt-4">
                            Ranked by execution. Not intentions.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="px-6 py-4 bg-black dark:bg-white text-white dark:text-black rounded-xl">
                            <span className="block text-[9px] font-black uppercase tracking-widest opacity-60">Your Rank</span>
                            <span className="text-2xl font-black"># --</span>
                        </div>
                        <div className="px-6 py-4 bg-monad-purple text-white rounded-xl shadow-[0_0_20px_rgba(131,110,249,0.3)]">
                            <span className="block text-[9px] font-black uppercase tracking-widest opacity-60 font-mono">Global Avg</span>
                            <span className="text-2xl font-black font-mono">642</span>
                        </div>
                    </div>
                </div>

                {/* Board Table */}
                <div className="bg-white dark:bg-[#1a1a1a] border-4 border-black dark:border-white/10 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black text-white dark:bg-white dark:text-black">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Rank</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Executor</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Score</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Win Rate</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Total Won</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-black dark:divide-white/10">
                            {TOP_EXECUTORS.map((user, idx) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-monad-purple/5 transition-colors cursor-pointer group"
                                >
                                    <td className="px-6 py-6 font-black text-2xl tracking-tighter italic">
                                        {idx === 0 ? <Medal className="text-yellow-500 w-8 h-8" /> :
                                            idx === 1 ? <Medal className="text-gray-400 w-8 h-8" /> :
                                                idx === 2 ? <Medal className="text-amber-600 w-8 h-8" /> :
                                                    `#${idx + 1}`}
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-monad-purple/10 rounded-full flex items-center justify-center font-black text-monad-purple">
                                                {user.user[0]}
                                            </div>
                                            <span className="font-black text-lg uppercase group-hover:text-monad-purple transition-colors">{user.user}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-mono">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-2xl">{user.score}</span>
                                            <div className="h-2 w-24 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-monad-purple"
                                                    style={{ width: `${(user.score / 1000) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-bold text-[#666] dark:text-[#999] font-mono">{user.winRate}</td>
                                    <td className="px-6 py-6 font-black text-green-500 font-mono">{user.totalWon}</td>
                                    <td className="px-6 py-6">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-sm uppercase ${user.status === 'god-tier' ? 'bg-yellow-100 text-yellow-700' :
                                            user.status === 'executor' ? 'bg-blue-100 text-blue-700' :
                                                user.status === 'burn-out' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {user.status === 'burn-out' && <Skull className="w-3 h-3 inline mr-1" />}
                                            {user.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer info */}
                <div className="mt-8 p-8 border-2 border-dashed border-black/10 dark:border-white/10 text-center">
                    <p className="text-xs font-bold text-[#888] uppercase tracking-widest">
                        Updates every UTC midnight. Don&apos;t be at the bottom tomorrow.
                    </p>
                </div>
            </div>
        </div>
    );
}
