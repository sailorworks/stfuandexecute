/**
 * GET /api/contracts/challenge/[contractId]
 *
 * Returns the combined DB + on-chain state for a challenge.
 * Public endpoint — no auth required.
 */
import { db } from "@/lib/db";
import { challenges, challengeBets } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { publicClient } from "@/lib/contracts/publicClient";
import { vaultContract, marketContract } from "@/lib/contracts/config";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;

  // DB lookup
  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.contractChallengeId, contractId))
    .limit(1);

  if (!challenge) return new Response("Not found", { status: 404 });

  // Bet counts from DB (fast)
  const [betCounts] = await db
    .select({ total: count() })
    .from(challengeBets)
    .where(eq(challengeBets.challengeId, challenge.id));

  // On-chain state (fresh) — only if contract is deployed
  let onChain: { vault: unknown; market: unknown } | null = null;
  const vaultAddr = process.env.NEXT_PUBLIC_VAULT_ADDRESS;
  if (vaultAddr && vaultAddr !== "") {
    try {
      const [vaultData, marketData] = await Promise.all([
        publicClient.readContract({
          ...vaultContract,
          functionName: "getChallenge",
          args:         [BigInt(contractId)],
        }),
        publicClient.readContract({
          ...marketContract,
          functionName: "getMarket",
          args:         [BigInt(contractId)],
        }),
      ]);
      onChain = { vault: vaultData, market: marketData };
    } catch (err) {
      // Ignore — contract may not be deployed yet in dev
      console.warn("On-chain read failed:", err);
    }
  }

  return Response.json({
    challenge: {
      ...challenge,
      // Serialise BigInt fields as strings for JSON
      stakeAmount: challenge.stakeAmount ?? null,
    },
    betCount: betCounts?.total ?? 0,
    onChain,
  });
}
