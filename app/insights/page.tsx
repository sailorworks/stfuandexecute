"use client";

import { motion } from "framer-motion";
import { Activity, Flame, Target, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";

export default function InsightsPage() {
    return (
        <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0f1011] pt-20 px-6 pb-20">
            <div className="max-w-[1400px] mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[10vw] md:text-[6rem] font-black leading-none tracking-brutalist uppercase"
                    >
                        Insights.
                    </motion.h1>
                    <div className="flex items-center gap-4 mt-4">
                        <p className="text-xl font-bold bg-monad-purple text-white px-3 py-1 uppercase tracking-tighter font-mono">
                            Performance Report
                        </p>
                        <span className="text-sm font-bold text-[#888] uppercase tracking-widest italic">
                            User: STFU_Explorer_7
                        </span>
                    </div>
                </div>

                {/* Global Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: "Executions", val: "14", icon: Target, color: "text-monad-purple" },
                        { label: "Success Rate", val: "86%", icon: CheckCircle2, color: "text-green-500" },
                        { label: "Avg Stake", val: "0.45 ETH", icon: TrendingUp, color: "text-monad-purple" },
                        { label: "Current Streak", val: "5 Days", icon: Flame, color: "text-orange-500" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/10 p-6 rounded-2xl shadow-lg"
                        >
                            <stat.icon className={`w-6 h-6 ${stat.color} mb-4`} />
                            <span className="block text-[10px] font-black text-[#999] dark:text-[#555] uppercase tracking-widest font-mono">{stat.label}</span>
                            <span className="text-3xl font-black mt-1 font-mono">{stat.val}</span>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart Card */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] border-4 border-black dark:border-white/10 p-8 rounded-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <Activity className="w-5 h-5 text-monad-purple" /> Execution Consistency
                            </h3>
                            <div className="flex gap-2">
                                {['WK', 'MO', 'YR'].map(t => (
                                    <button key={t} className={`text-[10px] font-black px-2 py-1 border-2 border-black dark:border-white/20 uppercase tracking-tighter font-mono ${t === 'WK' ? 'bg-monad-purple text-white border-monad-purple' : ''}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Brutalist CSS Bar Chart */}
                        <div className="flex items-end justify-between h-64 gap-2 md:gap-4 mt-12 pb-8 border-b-2 border-dashed border-black/10 dark:border-white/10">
                            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                    <div className="relative w-full">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ duration: 1, delay: i * 0.05 }}
                                            className="w-full bg-monad-purple group-hover:bg-monad-deep transition-colors relative shadow-[0_0_15px_rgba(131,110,249,0.2)]"
                                        >
                                            <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
                                        </motion.div>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#888] uppercase tracking-tighter font-mono">Day {i + 1}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-monad-purple" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#666] font-mono">Productivity Level</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-dashed border-black/20 dark:border-white/20" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#666]">Baseline Target</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar - Recent Failures / Warnings */}
                    <div className="space-y-6">
                        <div className="bg-[#ff3358]/10 border-4 border-[#ff3358]/20 p-8 rounded-2xl">
                            <div className="flex items-center gap-2 text-[#ff3358] mb-4">
                                <AlertTriangle className="w-6 h-6" />
                                <h3 className="text-xl font-black uppercase">Failing Zone</h3>
                            </div>
                            <p className="text-sm font-bold opacity-80 mb-6">You are dropping off on weekends. Fix your discipline or your stake is at risk.</p>
                            <div className="space-y-3">
                                <div className="p-3 bg-white dark:bg-black/20 border-2 border-[#ff3358]/20 rounded-xl">
                                    <span className="block text-[9px] font-black text-[#ff3358] opacity-60 uppercase mb-1">Last Warning</span>
                                    <p className="text-xs font-black uppercase tracking-tight">Tweet not posted by 12:00PM Friday</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1a1a1a] border-4 border-black dark:border-white/10 p-8 rounded-2xl relative overflow-hidden">
                            <div className="absolute -right-8 -bottom-8 opacity-[0.03] rotate-12">
                                <Target className="w-48 h-48" />
                            </div>
                            <h3 className="text-xl font-black uppercase mb-6">Upcoming Targets</h3>
                            <div className="space-y-4 relative z-10">
                                {[
                                    { t: "Complete Solidity Module", d: "Tomorrow", p: 80 },
                                    { t: "Morning Run (5km)", d: "Monday", p: 0 },
                                ].map(item => (
                                    <div key={item.t} className="space-y-2">
                                        <div className="flex justify-between text-[10px] font-black uppercase font-mono">
                                            <span>{item.t}</span>
                                            <span className="text-monad-purple italic">{item.d}</span>
                                        </div>
                                        <div className="h-1.5 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-monad-purple shadow-[0_0_10px_rgba(131,110,249,0.4)]" style={{ width: `${item.p}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
