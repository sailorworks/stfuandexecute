"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Zap, Heart, Flame, Skull } from "lucide-react";

export default function MissionPage() {
    return (
        <div className="min-h-screen bg-[#f4f4f4] dark:bg-[#0f1011] pt-20 px-6 pb-20">
            <div className="max-w-[1400px] mx-auto">
                {/* Hero Section */}
                <div className="mb-20 text-center">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[12vw] md:text-[8rem] font-black leading-none tracking-brutalist uppercase"
                    >
                        The Mission.
                    </motion.h1>
                    <p className="text-xl md:text-3xl font-black text-monad-purple uppercase tracking-tighter mt-4 max-w-2xl mx-auto font-mono">
                        Build something. Prove it. Don&apos;t be a coward.
                    </p>
                </div>

                {/* Content Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                    <div className="space-y-8">
                        <div className="p-8 bg-white dark:bg-[#1a1a1a] border-4 border-black dark:border-white/10 rounded-2xl relative overflow-hidden shadow-xl">
                            <Zap className="absolute -right-8 -bottom-8 w-40 h-40 opacity-[0.03] text-monad-purple" />
                            <h3 className="text-2xl font-black uppercase mb-4">Execution is Everything</h3>
                            <p className="text-lg font-bold opacity-70 leading-relaxed italic">
                                The world is full of "ideas". Most of them die in a Notion doc. We built STFU & Execute to force people to actually SHIP. If you can&apos;t prove it to an AI agent, you didn&apos;t do it.
                            </p>
                        </div>

                        <div className="p-8 bg-black dark:bg-white text-white dark:text-black rounded-2xl">
                            <h3 className="text-2xl font-black uppercase mb-4 text-monad-purple">The Stake Model</h3>
                            <p className="text-lg font-bold opacity-90 leading-relaxed">
                                Skin in the game works. When you stake MONAD or ETH, failure has a cost. Success has a reward. We align your financial incentives with your personal goals.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-12 py-8">
                        <div className="flex gap-6">
                            <div className="flex-shrink-0 w-12 h-12 bg-monad-purple rounded-full flex items-center justify-center">
                                <ShieldCheck className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase mb-2">Zero Sugarcoating</h4>
                                <p className="font-bold opacity-60">Our AI agents aren&apos;t friendly bots. They are brutal accountability partners. If you miss a commit, they call you out in public.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="flex-shrink-0 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                                <Flame className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase mb-2">The Burn Protocol</h4>
                                <p className="font-bold opacity-60">Failing a challenge means your stake goes to the treasury or is burned. No refunds. No excuses. Execute or pay the price.</p>
                            </div>
                        </div>

                        <div className="flex gap-6">
                            <div className="flex-shrink-0 w-12 h-12 bg-black dark:bg-monad-purple rounded-full flex items-center justify-center">
                                <Skull className="text-white w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="text-xl font-black uppercase mb-2">Public Shame / Glory</h4>
                                <p className="font-bold opacity-60">Every challenge is live in the Arena. Your reputation is on the line. Become a top executor or live in the burn-out zone.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Closing CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-32 p-12 bg-monad-purple text-white text-center rounded-[3rem] shadow-[0_0_50px_rgba(131,110,249,0.3)]"
                >
                    <h2 className="text-4xl md:text-6xl font-black uppercase mb-8">Ready to lock it in?</h2>
                    <button className="px-12 py-5 bg-white text-black font-black text-xl uppercase tracking-tighter hover:scale-105 transition-transform rounded-full">
                        Start Your First Challenge →
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
