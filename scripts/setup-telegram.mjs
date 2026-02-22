#!/usr/bin/env node
/**
 * Run after setting TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.local
 * Usage: node scripts/setup-telegram.mjs
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// Parse .env.local manually
const envPath = resolve(process.cwd(), ".env.local");
const envVars = {};
try {
  readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const [key, ...rest] = trimmed.split("=");
      envVars[key.trim()] = rest.join("=").trim();
    });
} catch {
  console.error("❌  Could not read .env.local — make sure it exists.");
  process.exit(1);
}

const TOKEN = envVars.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = envVars.TELEGRAM_CHAT_ID;

if (!TOKEN) {
  console.error("❌  TELEGRAM_BOT_TOKEN is missing from .env.local");
  process.exit(1);
}
if (!CHANNEL_ID) {
  console.error("❌  TELEGRAM_CHAT_ID is missing from .env.local");
  process.exit(1);
}

const BASE = `https://api.telegram.org/bot${TOKEN}`;

async function tg(method, body = {}) {
  const res = await fetch(`${BASE}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

console.log("\n🔍  Checking Telegram setup...\n");

// 1. Verify bot token
const me = await tg("getMe");
if (!me.ok) {
  console.error(`❌  Bot token is invalid: ${me.description}`);
  console.error(
    "    Go to @BotFather on Telegram → /mybots → select your bot → API Token → Revoke & copy the new token."
  );
  process.exit(1);
}
console.log(`✅  Bot: @${me.result.username} (${me.result.first_name})`);

// 2. Verify bot is in the channel
const chat = await tg("getChat", { chat_id: CHANNEL_ID });
if (!chat.ok) {
  console.error(`❌  Cannot access chat ${CHANNEL_ID}: ${chat.description}`);
  console.error(
    "    Make sure the bot is an admin in the group and TELEGRAM_CHAT_ID is correct."
  );
  process.exit(1);
}

const chatInfo = chat.result;
console.log(`✅  Channel: "${chatInfo.title}" (${chatInfo.type})`);

if (chatInfo.type !== "supergroup") {
  console.warn(
    `⚠️   Chat type is "${chatInfo.type}" — it must be a "supergroup" with Topics enabled for forum topics to work.`
  );
  console.warn(
    "    In Telegram: open group → Edit → Topics → Enable. This also converts it to a supergroup."
  );
}

// 3. Check if forum topics are enabled
if (!chatInfo.is_forum) {
  console.error("❌  Forum/Topics mode is NOT enabled on this group.");
  console.error(
    "    In Telegram: open the group → Edit → Topics → Enable."
  );
  process.exit(1);
}
console.log("✅  Forum/Topics mode is enabled.");

// 4. Check bot admin rights
const botMember = await tg("getChatMember", {
  chat_id: CHANNEL_ID,
  user_id: me.result.id,
});
if (!botMember.ok) {
  console.error(`❌  Could not check bot membership: ${botMember.description}`);
  process.exit(1);
}

const status = botMember.result.status;
if (status !== "administrator") {
  console.error(
    `❌  Bot is "${status}" — it must be an administrator to create topics.`
  );
  console.error(
    "    In Telegram: open the group → Admins → Add admin → select your bot → enable 'Manage Topics'."
  );
  process.exit(1);
}

const canManageTopics = botMember.result.can_manage_topics;
if (!canManageTopics) {
  console.error("❌  Bot is an admin but does NOT have 'Manage Topics' permission.");
  console.error(
    "    In Telegram: Admins → your bot → enable 'Manage Topics'."
  );
  process.exit(1);
}
console.log("✅  Bot is admin with Manage Topics permission.");

// 5. Test: create a topic, post a message, delete the topic
console.log("\n🧪  Running live test (create topic → post message → delete topic)...");
const testTopic = await tg("createForumTopic", {
  chat_id: CHANNEL_ID,
  name: "⚙️ Setup Test — Delete Me",
});
if (!testTopic.ok) {
  console.error(`❌  Failed to create forum topic: ${testTopic.description}`);
  process.exit(1);
}

const threadId = testTopic.result.message_thread_id;
console.log(`   Created topic with thread_id: ${threadId}`);

const msg = await tg("sendMessage", {
  chat_id: CHANNEL_ID,
  message_thread_id: threadId,
  text: "✅ STFU & Execute bot is set up correctly. This test topic will be deleted.",
});
if (!msg.ok) {
  console.error(`❌  Failed to send message: ${msg.description}`);
  process.exit(1);
}
console.log("   Sent test message.");

const del = await tg("deleteForumTopic", {
  chat_id: CHANNEL_ID,
  message_thread_id: threadId,
});
if (del.ok) {
  console.log("   Deleted test topic.");
} else {
  console.warn(`⚠️   Could not delete test topic (you can remove it manually): ${del.description}`);
}

// 6. Print the channel link prefix
const numericId = CHANNEL_ID.replace(/^-100/, "");
console.log(`\n✅  All checks passed!`);
console.log(`\n   Topic links will look like: https://t.me/c/${numericId}/<thread_id>`);
console.log(`\n   You're good to go. Start the dev server and run a challenge.\n`);
