import {
    pgTable, text, timestamp, uuid, pgEnum, boolean, integer, index
} from "drizzle-orm/pg-core";

export const challengeStatusEnum = pgEnum("challenge_status", ["active", "completed", "failed"]);
export const taskStatusEnum       = pgEnum("task_status", ["pending", "completed", "verified"]);
// On-chain enums (all nullable — added without breaking existing rows)
export const resolutionStatusEnum = pgEnum("resolution_status", ["pending", "success", "failure"]);
export const tokenTypeEnum        = pgEnum("token_type", ["native", "usdc"]);

export const users = pgTable("users", {
    id:                  text("id").primaryKey(), // Privy User ID (did:privy:...)
    walletAddress:       text("wallet_address"),
    telegramUsername:    text("telegram_username"),
    onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
    createdAt:           timestamp("created_at").defaultNow().notNull(),
    updatedAt:           timestamp("updated_at").defaultNow().notNull(),
});

export const challenges = pgTable("challenges", {
    id:     uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    goal:   text("goal").notNull(),
    stake:  text("stake"),   // human-readable (legacy; superseded by stakeAmount + stakeToken below)
    status: challengeStatusEnum("status").default("active").notNull(),

    // ── On-chain fields (nullable — populated after tx is confirmed) ──────────
    // ChallengeVault uses uint256 challengeId (auto-increment).
    // We store it as text to avoid BigInt serialisation issues.
    contractChallengeId: text("contract_challenge_id").unique(),  // uint256 as decimal string
    txHashCreate:        text("tx_hash_create"),                  // createChallenge tx
    stakeAmount:         text("stake_amount"),                    // amount in smallest unit (wei / μUSDC)
    stakeToken:          tokenTypeEnum("stake_token"),
    deadline:            timestamp("deadline"),
    onChainStatus:       resolutionStatusEnum("on_chain_status").default("pending"),
    aiScore:             integer("ai_score"),                     // 0-100 from oracle
    finalScore:          integer("final_score"),                  // 0-100 composite
    proofUri:            text("proof_uri"),                       // IPFS/URL for self-report
    goalHash:            text("goal_hash"),                       // keccak256 of goal text

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
    id:          uuid("id").defaultRandom().primaryKey(),
    challengeId: uuid("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    status:      taskStatusEnum("status").default("pending").notNull(),
    createdAt:   timestamp("created_at").defaultNow().notNull(),
    updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

export const challengeBets = pgTable("challenge_bets", {
    id:            uuid("id").defaultRandom().primaryKey(),
    challengeId:   uuid("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }),
    userId:        text("user_id").notNull().references(() => users.id),
    walletAddress: text("wallet_address").notNull(),
    betPass:       boolean("bet_pass").notNull(),    // true = challenger succeeds
    amount:        text("amount").notNull(),          // smallest unit as string
    token:         tokenTypeEnum("token").notNull(),
    txHash:        text("tx_hash"),
    claimed:       boolean("claimed").default(false).notNull(),
    claimTxHash:   text("claim_tx_hash"),
    createdAt:     timestamp("created_at").defaultNow().notNull(),
}, (t) => [
    index("challenge_bets_challenge_idx").on(t.challengeId),
    index("challenge_bets_user_idx").on(t.userId),
]);
