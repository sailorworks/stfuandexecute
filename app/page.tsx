"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquareText, Loader2 } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

const TriangleShape = ({ className }: { className?: string }) => (
  <svg className={`absolute inset-0 w-full h-full fill-current overflow-visible ${className}`} viewBox="0 0 200 200" preserveAspectRatio="none">
    <polygon points="100,20 180,170 20,170" strokeLinejoin="round" stroke="currentColor" strokeWidth="20" />
    <polygon points="100,20 180,170 20,170" fill="currentColor" />
  </svg>
)

const JaggedSquare = ({ className }: { className?: string }) => {
  const points = `
    0,0 10,2 20,0 30,2 40,0 50,2 60,0 70,2 80,0 90,2 100,0
    98,10 100,20 98,30 100,40 98,50 100,60 98,70 100,80 98,90 100,100
    90,98 80,100 70,98 60,100 50,98 40,100 30,98 20,100 10,98 0,100
    2,90 0,80 2,70 0,60 2,50 0,40 2,30 0,20 2,10
  `;
  return (
    <svg className={`absolute inset-0 w-full h-full fill-current overflow-visible ${className}`} viewBox="0 0 100 100" preserveAspectRatio="none">
      <polygon points={points.trim().replace(/\s+/g, ' ')} strokeLinejoin="miter" stroke="currentColor" strokeWidth="1" />
    </svg>
  );
};

const HouseShape = ({ className }: { className?: string }) => (
  <svg className={`absolute inset-0 w-full h-full fill-current overflow-visible ${className}`} viewBox="0 0 200 200" preserveAspectRatio="none">
    <rect x="40" y="90" width="120" height="90" strokeLinejoin="round" stroke="currentColor" strokeWidth="8" />
    <polygon points="100,25 180,90 20,90" strokeLinejoin="round" stroke="currentColor" strokeWidth="12" />
    <rect x="45" y="45" width="20" height="40" strokeLinejoin="round" stroke="currentColor" strokeWidth="8" />
    <rect x="42" y="85" width="116" height="95" fill="currentColor" />
  </svg>
);

const AsteriskShape = ({ className }: { className?: string }) => (
  <svg className={`w-full h-full fill-current overflow-visible ${className}`} viewBox="0 0 100 100">
    <rect x="40" y="10" width="20" height="80" rx="4" />
    <rect x="40" y="10" width="20" height="80" rx="4" transform="rotate(60 50 50)" />
    <rect x="40" y="10" width="20" height="80" rx="4" transform="rotate(120 50 50)" />
  </svg>
);

const KeyShape = ({ className }: { className?: string }) => (
  <svg className={`absolute inset-0 w-full h-full fill-current overflow-visible ${className}`} viewBox="0 0 200 100">
    <path d="M 50 20 C 10 20 10 95 60 95 C 150 95 150 95 150 95 L 150 80 L 170 80 L 170 65 L 190 65 L 190 45 L 150 45 L 150 20 Z" fill="currentColor" strokeLinejoin="round" />
    <circle cx="55" cy="55" r="10" fill="#f4f4f4" className="dark:fill-[#0f1011]" />
  </svg>
);

export default function Home() {
  const { ready, authenticated, login } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) {
      router.push("/challenge");
    }
  }, [ready, authenticated, router]);

  const handleStartChallenge = () => {
    if (!authenticated) {
      login();
    }
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col items-center font-sans tracking-tight bg-[#f4f4f4] dark:bg-[#0f1011]">
      <div className="global-noise" />
      <div className="bg-razor-grid absolute inset-0 pointer-events-none" />

      {/* Main Content Container */}
      <main className="relative z-10 w-full max-w-[1400px] flex-1 flex flex-col pt-4 md:pt-8 items-center justify-between pb-6">

        {/* Typographical Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center w-full px-4 flex-shrink-0"
        >
          <h1 className="text-[12vw] md:text-[6rem] lg:text-[7.5rem] font-black leading-[0.9] tracking-brutalist uppercase text-[#1c1c1c] dark:text-[#f4f4f4] select-none text-center mix-blend-multiply dark:mix-blend-lighten">
            STFU AND EXECUTE.
          </h1>
        </motion.div>

        {/* Collage Area */}
        <div className="relative w-full flex-1 max-h-[350px] md:max-h-[450px] lg:max-h-[500px] mt-4 origin-center select-none pointer-events-none">

          {/* Card 1: Black Triangle */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: -12 }}
            transition={{ duration: 0.7, delay: 0.1, type: "spring" }}
            className="absolute left-[5%] md:left-[10%] xl:left-[15%] top-[15%] w-[180px] h-[180px] md:w-[260px] md:h-[260px] text-[#222] dark:text-[#2a2a2a] drop-shadow-2xl z-10"
          >
            <TriangleShape />
            <div className="absolute inset-0 flex items-center justify-center p-8 pt-12 md:p-14 md:pt-16">
              <h3 className="text-white text-center font-black text-xs md:text-xl lg:text-2xl leading-[1.1] tracking-tight uppercase">
                70%+<br />OF PEOPLE<br />DON&apos;T FINISH<br />WHAT THEY<br />START.
              </h3>
            </div>
          </motion.div>

          {/* Card 4: Right Blue Jagged Rect */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotate: 15 }}
            animate={{ opacity: 1, y: 0, rotate: 8 }}
            transition={{ duration: 0.7, delay: 0.3, type: "spring" }}
            className="absolute right-[5%] md:right-[10%] xl:right-[15%] top-[5%] w-[160px] h-[240px] md:w-[220px] md:h-[340px] text-monad-purple drop-shadow-xl z-20"
          >
            <JaggedSquare />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-10 pt-10 md:pt-16">
              <h3 className="text-white text-center font-black text-xl md:text-[2rem] leading-[1] tracking-tight uppercase mb-4 md:mb-8 font-sans">
                AI<br />IS<br />WATCHING.
              </h3>
              <div className="border-t-[3px] border-dotted border-white/60 w-full pt-2 md:pt-4">
                <p className="text-white/90 text-[9px] md:text-xs font-bold tracking-wider uppercase text-center font-mono">
                  *PROVE IT OR LOSE IT
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Left Blue Jagged Square */}
          <motion.div
            initial={{ opacity: 0, x: -30, rotate: -15 }}
            animate={{ opacity: 1, x: 0, rotate: -6 }}
            transition={{ duration: 0.7, delay: 0.2, type: "spring" }}
            className="absolute left-[28%] md:left-[32%] top-[15%] md:top-[25%] w-[160px] h-[180px] md:w-[240px] md:h-[260px] text-monad-purple drop-shadow-2xl z-30"
          >
            <JaggedSquare />
            <div className="absolute inset-0 flex items-center justify-center p-6 md:p-10">
              <h3 className="text-white text-center font-black text-sm md:text-xl lg:text-2xl leading-[1.05] tracking-tight uppercase font-sans">
                BET ON<br />YOURSELF.<br />OR BET<br />AGAINST.
              </h3>
            </div>
          </motion.div>

          {/* Asterisk */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 18 }}
            transition={{ duration: 0.6, delay: 0.6, type: "spring", stiffness: 200 }}
            className="absolute left-[40%] top-[2%] md:top-[5%] w-[40px] h-[40px] md:w-[60px] md:h-[60px] text-monad-deep z-40"
          >
            <AsteriskShape />
          </motion.div>

          {/* Card 3: Black House */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 15 }}
            animate={{ opacity: 1, scale: 1, rotate: 5 }}
            transition={{ duration: 0.7, delay: 0.4, type: "spring" }}
            className="absolute left-[45%] md:left-[48%] top-[10%] w-[200px] h-[200px] md:w-[300px] md:h-[300px] text-[#222] dark:text-[#2a2a2a] drop-shadow-[0_20px_40px_rgba(0,0,0,0.3)] z-50"
          >
            <HouseShape />
            <div className="absolute inset-0 flex items-center justify-center p-8 pt-14 md:p-12 md:pt-20">
              <h3 className="text-white text-left font-black text-sm md:text-xl lg:text-2xl leading-[1.1] tracking-tight uppercase">
                ₹10,000<br />LOCKED.<br />7 DAYS.<br />NO EXCUSES.
              </h3>
            </div>
          </motion.div>

          {/* Key Shape */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotate: 30 }}
            animate={{ opacity: 1, y: 0, rotate: 15 }}
            transition={{ duration: 0.7, delay: 0.5, type: "spring" }}
            className="absolute left-[62%] md:left-[62%] bottom-[10%] md:bottom-[0%] w-[120px] h-[60px] md:w-[200px] md:h-[100px] text-monad-light z-50 drop-shadow-xl"
          >
            <KeyShape />
          </motion.div>

        </div>

        {/* CTA Section below the collage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="relative z-50 flex flex-col items-center gap-4 flex-shrink-0"
        >
          <button
            onClick={handleStartChallenge}
            disabled={!ready || authenticated}
            className="group relative px-10 py-4 md:px-12 md:py-5 bg-monad-purple text-white font-black text-base md:text-lg rounded-full overflow-hidden shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-monad-deep disabled:opacity-70 disabled:cursor-wait"
          >
            <span className="relative z-10 flex items-center gap-2 tracking-tight uppercase">
              {!ready ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : authenticated ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "Start the Challenge"
              )}
            </span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
          </button>

          <button
            onClick={handleStartChallenge}
            disabled={!ready}
            className="flex items-center gap-2 text-xs md:text-sm font-bold text-[#888] hover:text-black dark:hover:text-white transition-colors group tracking-tight uppercase disabled:opacity-50 font-mono"
          >
            Just talk to the AI
            <MessageSquareText className="w-3 h-3 md:w-4 md:h-4 group-hover:translate-x-1 group-hover:text-monad-purple transition-all" />
          </button>
        </motion.div>

      </main>
    </div>
  );
}
