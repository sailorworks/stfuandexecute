import { NextResponse } from "next/server";
import { PrivyClient } from "@privy-io/server-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { env } from "@/lib/env";

const privy = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const claims = await privy.verifyAuthToken(token);

    const body = await req.json();
    const { telegramUsername } = body;

    if (!telegramUsername) {
      return NextResponse.json({ error: "Missing telegram username" }, { status: 400 });
    }

    const cleanUsername = (telegramUsername as string).replace(/^@/, "").trim();

    // 1. Save to Privy Custom Metadata
    await privy.setCustomMetadata(claims.userId, {
      telegramUsername: cleanUsername,
    });

    // 2. Upsert into our Drizzle DB
    await db.insert(users).values({
      id: claims.userId,
      telegramUsername: cleanUsername,
    }).onConflictDoUpdate({
      target: users.id,
      set: { telegramUsername: cleanUsername }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

