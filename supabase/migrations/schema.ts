import { pgTable, text, timestamp, boolean, foreignKey, uuid, unique, integer, index, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const challengeStatus = pgEnum("challenge_status", ['active', 'completed', 'failed'])
export const resolutionStatus = pgEnum("resolution_status", ['pending', 'success', 'failure'])
export const taskStatus = pgEnum("task_status", ['pending', 'completed', 'verified'])
export const tokenType = pgEnum("token_type", ['native', 'usdc'])


export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	telegramUsername: text("telegram_username"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	walletAddress: text("wallet_address"),
	onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	challengeId: uuid("challenge_id").notNull(),
	description: text().notNull(),
	status: taskStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.challengeId],
			foreignColumns: [challenges.id],
			name: "tasks_challenge_id_challenges_id_fk"
		}).onDelete("cascade"),
]);

export const challenges = pgTable("challenges", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	goal: text().notNull(),
	stake: text(),
	status: challengeStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	contractChallengeId: text("contract_challenge_id"),
	txHashCreate: text("tx_hash_create"),
	stakeAmount: text("stake_amount"),
	stakeToken: tokenType("stake_token"),
	deadline: timestamp({ mode: 'string' }),
	onChainStatus: resolutionStatus("on_chain_status").default('pending'),
	aiScore: integer("ai_score"),
	finalScore: integer("final_score"),
	proofUri: text("proof_uri"),
	goalHash: text("goal_hash"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "challenges_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("challenges_contract_challenge_id_unique").on(table.contractChallengeId),
]);

export const challengeBets = pgTable("challenge_bets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	challengeId: uuid("challenge_id").notNull(),
	userId: text("user_id").notNull(),
	walletAddress: text("wallet_address").notNull(),
	betPass: boolean("bet_pass").notNull(),
	amount: text().notNull(),
	token: tokenType().notNull(),
	txHash: text("tx_hash"),
	claimed: boolean().default(false).notNull(),
	claimTxHash: text("claim_tx_hash"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("challenge_bets_challenge_idx").using("btree", table.challengeId.asc().nullsLast().op("uuid_ops")),
	index("challenge_bets_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.challengeId],
			foreignColumns: [challenges.id],
			name: "challenge_bets_challenge_id_challenges_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "challenge_bets_user_id_users_id_fk"
		}),
]);
