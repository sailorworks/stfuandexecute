import { relations } from "drizzle-orm/relations";
import { challenges, tasks, users, challengeBets } from "./schema";

export const tasksRelations = relations(tasks, ({one}) => ({
	challenge: one(challenges, {
		fields: [tasks.challengeId],
		references: [challenges.id]
	}),
}));

export const challengesRelations = relations(challenges, ({one, many}) => ({
	tasks: many(tasks),
	user: one(users, {
		fields: [challenges.userId],
		references: [users.id]
	}),
	challengeBets: many(challengeBets),
}));

export const usersRelations = relations(users, ({many}) => ({
	challenges: many(challenges),
	challengeBets: many(challengeBets),
}));

export const challengeBetsRelations = relations(challengeBets, ({one}) => ({
	challenge: one(challenges, {
		fields: [challengeBets.challengeId],
		references: [challenges.id]
	}),
	user: one(users, {
		fields: [challengeBets.userId],
		references: [users.id]
	}),
}));