import postgres from "postgres";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const runMigration = async () => {
    const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!url) throw new Error("No DATABASE_URL");

    console.log("Connecting to", url.replace(/:[^:@]+@/, ":***@"));

    const sql = postgres(url, { prepare: false });
    const migrationFile = fs.readFileSync("./supabase/migrations/0000_green_karma.sql", "utf-8");

    console.log("Running migration...");
    try {
        await sql.unsafe(migrationFile);
        console.log("Migration successful!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await sql.end();
    }
};

runMigration();
