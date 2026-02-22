import { env } from "./env";

const BASE = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;

async function call(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API [${method}]: ${data.description}`);
  }
  return data.result;
}

export async function sendChallengeMessage(
  message: string
): Promise<void> {
  await call("sendMessage", {
    chat_id: env.TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: "HTML",
  });
}


