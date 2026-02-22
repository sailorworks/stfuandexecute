import { db } from "@/lib/db";
import { challenges, users } from "@/lib/db/schema";
import { isNotNull, eq, count, and, desc, sql } from "drizzle-orm";
import { ArenaFeed } from "./ArenaFeed";

export const dynamic = "force-dynamic";

export default async function ArenaPage() {
  // All on-chain challenges, joined with user wallet for display
  const liveChallenges = await db
    .select({
      contractChallengeId: challenges.contractChallengeId,
      goal:                challenges.goal,
      stakeAmount:         challenges.stakeAmount,
      stakeToken:          challenges.stakeToken,
      deadline:            challenges.deadline,
      onChainStatus:       challenges.onChainStatus,
      walletAddress:       users.walletAddress,
    })
    .from(challenges)
    .innerJoin(users, eq(challenges.userId, users.id))
    .where(isNotNull(challenges.contractChallengeId))
    .orderBy(desc(challenges.createdAt))
    .limit(20);

  // Stats using raw SQL count to avoid enum comparison issues
  const [{ total }] = await db
    .select({ total: count() })
    .from(challenges)
    .where(isNotNull(challenges.contractChallengeId));

  const [{ successCount }] = await db
    .select({ successCount: count() })
    .from(challenges)
    .where(
      and(
        isNotNull(challenges.contractChallengeId),
        sql`${challenges.onChainStatus}::text = 'success'`
      )
    );

  const [{ failureCount }] = await db
    .select({ failureCount: count() })
    .from(challenges)
    .where(
      and(
        isNotNull(challenges.contractChallengeId),
        sql`${challenges.onChainStatus}::text = 'failure'`
      )
    );

  // Active = on-chain but not yet resolved
  const active = total - successCount - failureCount;
  const resolved = successCount + failureCount;
  const successRate = resolved > 0 ? Math.round((successCount / resolved) * 100) : 0;

  return (
    <ArenaFeed
      challenges={liveChallenges.map((c) => ({
        ...c,
        contractChallengeId: c.contractChallengeId!,
        // Show as "active" if not yet resolved
        isResolved: c.onChainStatus === "success" || c.onChainStatus === "failure",
      }))}
      stats={{ active, total, successRate }}
    />
  );
}
