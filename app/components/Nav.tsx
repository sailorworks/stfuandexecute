"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Trophy, Activity, Zap, Info } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

export default function Nav() {
    const pathname = usePathname();
    const { authenticated, logout } = usePrivy();

    const navItems = [
        { name: "Arena", href: "/arena", icon: Zap },
        { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
        { name: "Insights", href: "/insights", icon: Activity },
        { name: "Mission", href: "/mission", icon: Info },
    ];

    // Don't show full nav on landing or onboarding
    const isMinimal = pathname === "/" || pathname === "/onboarding";

    return (
        <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/10 bg-[#f4f4f4]/80 dark:bg-[#0f1011]/80 backdrop-blur-md font-mono">
            <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
                <Link
                    href={authenticated ? "/challenge" : "/"}
                    className="italic text-monad-purple text-lg md:text-xl font-black tracking-tighter hover:scale-105 transition-transform font-sans"
                >
                    <span className="text-monad-light mr-1">1</span>STFU & EXECUTE
                </Link>

                {!isMinimal && (
                    <nav className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${isActive
                                        ? "text-monad-purple scale-110"
                                        : "text-[#999] dark:text-[#666] hover:text-monad-purple"
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                )}

                <div className="flex items-center gap-4">
                    {authenticated ? (
                        <>
                            <Link
                                href="/challenge"
                                className={`hidden sm:block text-[10px] font-black uppercase tracking-tighter px-3 py-1 border-2 border-monad-purple text-monad-purple rounded-md hover:bg-monad-purple hover:text-white transition-all ${pathname === "/challenge" ? "bg-monad-purple text-white" : ""
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={() => logout()}
                                className="p-2 text-[#999] hover:text-red-500 transition-colors"
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/"
                            className="text-[10px] font-black uppercase tracking-tighter px-4 py-2 bg-monad-purple text-white rounded-md hover:bg-monad-deep transition-all"
                        >
                            Start
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
