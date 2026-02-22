/**
 * POST /api/contracts/ai-verdict
 *
 * Called by the backend after the oracle computes the weighted score
 * (AI 60% + community vote 30% + self-report 10%) off-chain.
 * Submits the binary pass/fail verdict on-chain via the oracle wallet,
 * then updates the DB.
 *
 * Auth: ORACLE_WEBHOOK_SECRET (not a Privy token — this is a backend-to-backend call)
 */
import { z } from "zod";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { oracleResolve } from "@/lib/contracts/oracleWallet";

const bodySchema = z.object({
  contractChallengeId: z.string(),
  aiScore:             z.number().int().min(0).max(100),
  finalScore:          z.number().int().min(0).max(100),
  passed:              z.boolean(),
});

function verifyWebhookSecret(req: Request): boolean {
  const secret = process.env.ORACLE_WEBHOOK_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-oracle-secret");
  return header === secret;
}

export async function POST(req: Request) {
  if (!verifyWebhookSecret(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return new Response("Invalid body", { status: 400 });
  }

  // 1. Submit verdict on-chain
  let txHash: string;
  try {
    const { hash } = await oracleResolve(body.contractChallengeId, body.passed);
    txHash = hash;
  } catch (err) {
    console.error("Oracle resolve tx failed:", err);
    return new Response("Contract call failed", { status: 502 });
  }

  // 2. Sync DB
  await db
    .update(challenges)
    .set({
      aiScore:       body.aiScore,
      finalScore:    body.finalScore,
      onChainStatus: body.passed ? "success" : "failure",
      status:        body.passed ? "completed" : "failed",
      updatedAt:     new Date(),
    })
    .where(eq(challenges.contractChallengeId, body.contractChallengeId));

  return Response.json({ ok: true, txHash });
}
