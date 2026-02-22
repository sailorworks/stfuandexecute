/**
 * POST /api/contracts/create-challenge
 *
 * Called by the frontend AFTER createChallenge() is confirmed on-chain.
 * Links the on-chain contract ID to the existing DB challenge row.
 *
 * Auth: Privy Bearer token
 */
import { PrivyClient } from "@privy-io/server-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

const bodySchema = z.object({
  challengeDbId:       z.string().uuid(),
  contractChallengeId: z.string(),          // uint256 decimal string
  txHash:              z.string(),
  stakeAmount:         z.string(),          // wei / μUSDC as string
  stakeToken:          z.enum(["native", "usdc"]),
  deadline:            z.number().int().positive(),
  goalHash:            z.string(),
});

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return new Response("Unauthorized", { status: 401 });

  let userId: string;
  try {
    const claims = await privy.verifyAuthToken(token);
    userId = claims.userId;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return new Response("Invalid body", { status: 400 });
  }

  // Verify the challenge belongs to this user
  const [challenge] = await db
    .select({ id: challenges.id, userId: challenges.userId })
    .from(challenges)
    .where(eq(challenges.id, body.challengeDbId))
    .limit(1);

  if (!challenge) return new Response("Challenge not found", { status: 404 });
  if (challenge.userId !== userId) return new Response("Forbidden", { status: 403 });

  await db
    .update(challenges)
    .set({
      contractChallengeId: body.contractChallengeId,
      txHashCreate:        body.txHash,
      stakeAmount:         body.stakeAmount,
      stakeToken:          body.stakeToken,
      deadline:            new Date(body.deadline * 1000),
      goalHash:            body.goalHash,
      onChainStatus:       "pending",
      updatedAt:           new Date(),
    })
    .where(eq(challenges.id, body.challengeDbId));

  return Response.json({ ok: true, contractChallengeId: body.contractChallengeId });
}
