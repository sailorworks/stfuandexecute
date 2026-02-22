import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PredictionPanel } from "@/app/components/PredictionPanel";
import { ChallengeStatusBanner } from "@/app/components/ChallengeStatusBanner";

interface Props {
  params: Promise<{ contractId: string }>;
}

export default async function ArenaChallengePage({ params }: Props) {
  const { contractId } = await params;

  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.contractChallengeId, contractId))
    .limit(1);

  if (!challenge) notFound();

  const isResolved = challenge.onChainStatus !== "pending" && challenge.onChainStatus !== null;

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500 uppercase tracking-widest">
            <span>Arena</span>
            <span>/</span>
            <span>Challenge #{contractId}</span>
          </div>
          <h1 className="text-2xl font-bold leading-snug">{challenge.goal}</h1>
        </div>

        {/* On-chain status banner */}
        <ChallengeStatusBanner
          contractChallengeId={contractId}
          stakeAmount={challenge.stakeAmount ?? undefined}
          stakeToken={challenge.stakeToken ?? undefined}
          deadline={challenge.deadline ?? undefined}
        />

        {/* Scores (post-resolution) */}
        {isResolved && (
          <div className="rounded-xl border border-[#2a2a2a] p-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">AI Score</p>
              <p className="text-2xl font-bold text-white">{challenge.aiScore ?? "—"}<span className="text-zinc-500 text-base">/100</span></p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Final Score</p>
              <p className="text-2xl font-bold text-white">{challenge.finalScore ?? "—"}<span className="text-zinc-500 text-base">/100</span></p>
            </div>
            {challenge.proofUri && (
              <div className="col-span-2">
                <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Self-Report Proof</p>
                <a href={challenge.proofUri} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline text-sm break-all">
                  {challenge.proofUri}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Prediction market */}
        <PredictionPanel contractChallengeId={contractId} isResolved={isResolved} />

        {/* Resolution formula (transparency) */}
        <details className="text-xs text-zinc-500 rounded-xl border border-[#1a1a1a] p-4 space-y-2">
          <summary className="cursor-pointer text-zinc-400 font-medium">How is the outcome decided?</summary>
          <p className="mt-3">The final score is a weighted composite calculated by our backend oracle:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li><strong className="text-zinc-300">AI agent verdict (60%)</strong> — checks GitHub commits, Telegram activity, social posts via Composio</li>
            <li><strong className="text-zinc-300">Community vote (30%)</strong> — prediction market bettors vote; weighted by stake</li>
            <li><strong className="text-zinc-300">Self-report (10%)</strong> — challenger submits proof; reviewed by premium members</li>
          </ul>
          <p className="mt-2">Score ≥ 50 → <span className="text-green-400">SUCCESS</span>. Score &lt; 50 → <span className="text-red-400">FAILURE</span> (stake slashed).</p>
          <p>The full formula is documented in <code className="text-purple-400">ResolutionMath.sol</code> (on-chain, auditable).</p>
        </details>
      </div>
    </main>
  );
}
