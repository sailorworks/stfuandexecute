"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { Loader2 } from "lucide-react";

export default function Onboarding() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/");
      return;
    }
    // Already onboarded — go straight to challenge
    if (user?.customMetadata?.telegramUsername) {
      router.push("/challenge");
    }
  }, [ready, authenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please enter your Telegram username");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = await getAccessToken();
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ telegramUsername: username.trim() }),
      });

      if (!res.ok) {
        throw new Error("Failed to save username");
      }

      // Redirect to challenge
      router.push("/challenge");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
      setIsSubmitting(false);
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-[#f4f4f4] dark:bg-[#0f1011]">
        <Loader2 className="w-8 h-8 animate-spin text-monad-purple" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#f4f4f4] dark:bg-[#0f1011] p-6 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1b1e] p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-black uppercase tracking-tight mb-2 text-black dark:text-white">
          Complete Your Profile
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          The AI will broadcast your commitments and results to the STFU Telegram channel. We need your username to tag you.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="telegram" className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 font-mono">
              Telegram Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
              <input
                id="telegram"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="durov"
                className="w-full bg-gray-50 dark:bg-[#0f1011] border border-gray-200 dark:border-gray-800 rounded-xl px-10 py-4 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-monad-purple focus:border-transparent transition-all font-mono"
              />
            </div>
            {error && <span className="text-red-500 text-xs font-semibold">{error}</span>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full bg-monad-purple hover:bg-monad-deep text-white font-bold uppercase tracking-wider py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-mono"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
