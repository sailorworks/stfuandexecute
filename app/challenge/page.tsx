"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useEffect, FormEvent, useRef } from "react";
import { Send, Loader2, Lock } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { UIMessage } from "ai";
import { StakeModal } from "@/app/components/StakeModal";

export default function ChallengePage() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const router = useRouter();

  const { messages, sendMessage, status, error } = useChat();

  const isLoading = status === "submitted" || status === "streaming";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSetup, setShowSetup] = useState(true);
  const [goal, setGoal] = useState("");
  const [input, setInput] = useState("");

  // DB challenge ID — set when the user submits the goal form
  const [challengeDbId, setChallengeDbId] = useState<string | null>(null);
  const [showStakeModal, setShowStakeModal] = useState(false);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!ready) return;
    if (!authenticated) {
      router.push("/");
      return;
    }
    if (!user?.customMetadata?.telegramUsername) {
      router.push("/onboarding");
    }
  }, [ready, authenticated, user, router]);

  if (!ready || !authenticated || !user?.customMetadata?.telegramUsername) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-[#0f1011]">
        <Loader2 className="w-8 h-8 animate-spin text-monad-purple" />
      </div>
    );
  }

  const handleStartChallenge = async (e: FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    const token = await getAccessToken();

    // Create the challenge in DB first so we have an ID for StakeModal
    try {
      const res = await fetch("/api/challenges", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ goal: goal.trim() }),
      });
      if (res.ok) {
        const { id } = await res.json();
        setChallengeDbId(id);
      }
    } catch {
      // Non-fatal — user can still chat, just won't be able to lock on-chain until reconnected
    }

    setShowSetup(false);

    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    await sendMessage({ text: `My goal: ${goal.trim()}` }, { headers });
  };

  const handleChatSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const text = input.trim();
    setInput("");

    const token = await getAccessToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    await sendMessage({ text }, { headers });
  };

  const getMessageText = (m: UIMessage): string => {
    if (m.parts) {
      return m.parts
        .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
        .map((p) => p.text)
        .join("");
    }
    return "";
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0f1011] text-white font-sans overflow-hidden">
      {/* Setup Form */}
      {showSetup && messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-6">
          <form onSubmit={handleStartChallenge} className="w-full max-w-lg space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase mb-2">
                Define Your Challenge
              </h1>
              <p className="text-sm text-[#888]">
                The AI will analyze your goal, break it into verifiable tasks,
                and hold you accountable.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-2">
                Your Goal
              </label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Launch my SaaS landing page and get 100 signups"
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#555] resize-none focus:outline-none focus:border-monad-purple transition-colors text-sm font-mono"
                rows={3}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={!goal.trim()}
              className="w-full py-4 bg-monad-purple text-white font-black text-sm rounded-xl uppercase tracking-wider hover:bg-monad-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-mono shadow-lg"
            >
              Analyze my goal →
            </button>
          </form>
        </div>
      )}

      {/* Chat Interface */}
      {(!showSetup || messages.length > 0) && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-monad-purple text-white shadow-lg"
                      : "bg-[#1a1a1a] text-[#e0e0e0] border border-white/5"
                  }`}
                >
                  {m.role !== "user" && (
                    <div className="text-[10px] font-black text-monad-purple uppercase tracking-wider mb-1 font-mono">
                      STFU Agent
                    </div>
                  )}
                  {m.role === "user" ? (
                    <div className="whitespace-pre-wrap">{getMessageText(m)}</div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight prose-strong:text-white prose-li:text-[#e0e0e0] prose-p:text-[#e0e0e0] prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-p:my-1.5 prose-headings:my-2 prose-a:text-[#6b8aff] prose-a:underline prose-a:font-bold">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#6b8aff] underline font-bold hover:text-[#8ea8ff] transition-colors"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {getMessageText(m)}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl px-4 py-3">
                    <div className="text-[10px] font-black text-monad-purple uppercase tracking-wider mb-1 font-mono">
                      STFU Agent
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#888]">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Analyzing...
                    </div>
                  </div>
                </div>
              )}

            {error && (
              <div className="flex justify-start">
                <div className="bg-red-900/30 border border-red-500/20 rounded-2xl px-4 py-3 text-sm text-red-400">
                  {error.message || "Something went wrong. Try again."}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input + Lock Stake */}
          <div className="flex-shrink-0 border-t border-white/10 p-4 space-y-3">
            {/* Lock stake CTA — appears once the challenge exists in DB */}
            {challengeDbId && (
              <div className="max-w-3xl mx-auto">
                <button
                  onClick={() => setShowStakeModal(true)}
                  className="w-full py-2.5 rounded-xl border border-monad-purple/50 bg-monad-purple/10 text-monad-purple text-sm font-bold uppercase tracking-wider hover:bg-monad-purple/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Lock Stake on Chain
                </button>
              </div>
            )}

            <form
              onSubmit={handleChatSubmit}
              className="flex items-center gap-3 max-w-3xl mx-auto"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-[#555] text-sm focus:outline-none focus:border-monad-purple transition-colors font-mono"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-monad-purple p-3 rounded-xl hover:bg-monad-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </>
      )}

      {/* Stake Modal */}
      {showStakeModal && challengeDbId && (
        <StakeModal
          challengeDbId={challengeDbId}
          goalText={goal}
          onSuccess={(contractChallengeId) => {
            setShowStakeModal(false);
            router.push(`/arena/${contractChallengeId}`);
          }}
          onClose={() => setShowStakeModal(false)}
        />
      )}
    </div>
  );
}
