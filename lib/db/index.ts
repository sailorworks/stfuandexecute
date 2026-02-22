import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "@/lib/db/schema";

// Disable prefetch as it is not supported for "Transaction" pool mode in Supabase
export const client = postgres(env.DATABASE_URL as string, { prepare: false });
export const db = drizzle(client, { schema });
