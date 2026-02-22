import { z } from "zod";

const envSchema = z.object({
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url().optional(),
  COMPOSIO_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // The main STFU & Execute Telegram supergroup/forum channel ID (negative number, e.g. -1001234567890).
  // Each challenge creates a new topic (thread) inside this channel.
  TELEGRAM_CHAT_ID: z.string().min(1),
  // Bot token from @BotFather. The bot must be an admin in TELEGRAM_CHAT_ID with topic management rights.
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1),
  PRIVY_APP_ID: z.string().min(1),
  PRIVY_APP_SECRET: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1),
  DATABASE_URL: z.string().url().optional(), // Using optional so local dev doesn't totally break if it's missing initially
  DIRECT_URL: z.string().url().optional(),

  // ── Smart contracts ────────────────────────────────────────────────────
  // Server-side oracle wallet that calls ChallengeVault.resolve()
  ORACLE_PRIVATE_KEY: z.string().min(1).optional(),
  // Shared secret for the /api/contracts/ai-verdict endpoint
  ORACLE_WEBHOOK_SECRET: z.string().min(1).optional(),
  // Monad RPC (server-side; no NEXT_PUBLIC prefix for security)
  MONAD_RPC_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  throw new Error("Invalid environment variables. Check the console for details.");
}

export const env = parsed.data;
