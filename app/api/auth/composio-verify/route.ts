import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthState } from "@/lib/auth-state";

const COOKIE_NAME = "composio_auth_state";

/**
 * Simplified verify route: just validates the signed state cookie
 * and returns the userId. No Composio connection check needed since
 * connections happen dynamically in-chat.
 */
export async function POST() {
  const cookieStore = await cookies();
  const stateToken = cookieStore.get(COOKIE_NAME)?.value;

  if (!stateToken) {
    return NextResponse.json({ error: "No auth state" }, { status: 400 });
  }

  const verified = verifyAuthState(stateToken);
  if (!verified) {
    cookieStore.delete(COOKIE_NAME);
    return NextResponse.json({ error: "Invalid or expired state" }, { status: 400 });
  }

  cookieStore.delete(COOKIE_NAME);
  return NextResponse.json({ userId: verified.userId });
}
