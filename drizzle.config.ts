import { defineConfig } from "drizzle-kit";
import { env } from "./lib/env";

export default defineConfig({
    schema: "./lib/db/schema.ts",
    out: "./supabase/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: (process.env.DIRECT_URL || env.DATABASE_URL) as string,
    },
});
