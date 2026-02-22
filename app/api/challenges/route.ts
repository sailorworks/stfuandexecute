/**
 * POST /api/challenges
 *
 * Creates a new challenge row in the DB from the goal text.
 * Called by the challenge page before the user signs the on-chain tx.
 *
 * Auth: Privy Bearer token
 */
import { PrivyClient } from "@privy-io/server-auth";
import { z } from "zod";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

const bodySchema = z.object({
  goal: z.string().min(1).max(1000),
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

  const [challenge] = await db
    .insert(challenges)
    .values({ userId, goal: body.goal })
    .returning({ id: challenges.id, goal: challenges.goal });

  return Response.json({ id: challenge.id, goal: challenge.goal });
}
