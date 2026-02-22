/**
 * POST /api/contracts/place-bet
 *
 * Records a bet in the DB after the user has confirmed the on-chain betPass/betFail tx.
 * Auth: Privy Bearer token
 */
import { PrivyClient } from "@privy-io/server-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { challengeBets, challenges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

const bodySchema = z.object({
  contractChallengeId: z.string(),
  betPass:             z.boolean(),
  amount:              z.string(),
  token:               z.enum(["native", "usdc"]),
  txHash:              z.string(),
  walletAddress:       z.string(),
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
  } catch {
    return new Response("Invalid body", { status: 400 });
  }

  // Look up the DB challenge by contractChallengeId
  const [challenge] = await db
    .select({ id: challenges.id })
    .from(challenges)
    .where(eq(challenges.contractChallengeId, body.contractChallengeId))
    .limit(1);

  if (!challenge) return new Response("Challenge not found", { status: 404 });

  await db.insert(challengeBets).values({
    challengeId:   challenge.id,
    userId,
    walletAddress: body.walletAddress,
    betPass:       body.betPass,
    amount:        body.amount,
    token:         body.token,
    txHash:        body.txHash,
  });

  return Response.json({ ok: true });
}
