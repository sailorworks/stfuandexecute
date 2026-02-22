import { db } from "./lib/db";
import { challenges, users } from "./lib/db/schema";
import { isNotNull, eq, and, desc } from "drizzle-orm";

async function test() {
    const query = db
        .select({
            contractChallengeId: challenges.contractChallengeId,
            goal: challenges.goal,
            stakeAmount: challenges.stakeAmount,
            stakeToken: challenges.stakeToken,
            deadline: challenges.deadline,
            walletAddress: users.walletAddress,
        })
        .from(challenges)
        .innerJoin(users, eq(challenges.userId, users.id))
        .where(
            and(
                isNotNull(challenges.contractChallengeId),
                eq(challenges.onChainStatus, "pending")
            )
        )
        .orderBy(desc(challenges.createdAt))
        .limit(20);

    console.log("SQL:", query.toSQL());

    try {
        const results = await query;
        console.log("Success! Count:", results.length);
    } catch (e: any) {
        console.error("FAILED!");
        console.error(e);
    }
}

test();
