import { Composio } from "@composio/core";
import {
  convertToModelMessages,
  jsonSchema,
  stepCountIs,
  streamText,
  tool,
  type LanguageModel,
  type UIMessage,
} from "ai";
import { openai } from "@ai-sdk/openai";
import { experimental_createMCPClient } from "@ai-sdk/mcp";
import { z } from "zod";
import { PrivyClient } from "@privy-io/server-auth";
import { env } from "@/lib/env";
import { sendChallengeMessage } from "@/lib/telegram";

export const maxDuration = 60;

const rateLimit = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(userId: string) {
  const now = Date.now();
  const record = rateLimit.get(userId);

  if (!record || now - record.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateLimit.set(userId, { count: 1, lastReset: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

function getModel(modelId: string): LanguageModel {
  return openai(modelId);
}

// Maps each toolkit slug to the keywords that indicate it's relevant to the challenge.
// Twitter is always included for the public accountability pledge and is handled separately.
// Telegram is handled via custom tools (direct Bot API), NOT via Composio.
const TOOLKIT_KEYWORD_MAP: Record<string, string[]> = {
  github: [
    "code", "coding", "commit", "repo", "repository", "pull request", "open source",
    "developer", "software", "app", "saas", "deploy", "build", "launch", "ship",
    "programming", "typescript", "javascript", "python", "react", "nextjs", "api",
    "backend", "frontend", "fullstack", "website", "web app", "mobile app", "github",
    "git", "feature", "bug", "refactor",
  ],
  instagram: [
    "instagram", "reels", "stories", "ig", "influencer", "content creator",
    "followers", "post daily", "aesthetic", "feed",
  ],
  youtube: [
    "youtube", "video", "channel", "subscribers", "views", "upload", "vlog",
    "tutorial", "youtube channel",
  ],
  tiktok: [
    "tiktok", "tik tok", "short video", "viral", "for you page", "fyp",
  ],
  linkedin: [
    "linkedin", "professional", "networking", "b2b", "connections", "career",
    "job", "resume", "portfolio",
  ],
  reddit: [
    "reddit", "subreddit", "upvotes", "post on reddit", "r/",
  ],
  figma: [
    "figma", "design", "ui", "ux", "prototype", "wireframe", "mockup",
    "visual design", "graphic",
  ],
  notion: [
    "notion", "documentation", "wiki", "notes", "writing", "essay", "blog",
    "document",
  ],
  shopify: [
    "shopify", "store", "ecommerce", "e-commerce", "shop", "sell online",
    "product", "dropshipping",
  ],
  discord: [
    "discord", "server", "community", "members", "guild",
  ],
  spotify: [
    "spotify", "podcast", "music", "playlist", "audio", "episode",
  ],
  gmail: [
    "email", "newsletter", "inbox", "subscribers", "mailing list", "cold email",
  ],
};

const TOOLKIT_LABELS: Record<string, string> = {
  github: "GitHub (commits, PRs, repo activity)",
  instagram: "Instagram (posts, reels, follower count)",
  youtube: "YouTube (videos uploaded, subscriber count, views)",
  tiktok: "TikTok (videos posted, views, followers)",
  linkedin: "LinkedIn (posts, connections, engagement)",
  reddit: "Reddit (posts, upvotes, community activity)",
  figma: "Figma (files, frames, design progress)",
  notion: "Notion (pages, databases, writing output)",
  shopify: "Shopify (products, orders, store activity)",
  discord: "Discord (server activity, member count)",
  spotify: "Spotify (episodes, streams, followers)",
  gmail: "Gmail (emails sent, newsletter opens)",
  twitter: "Twitter/X (tweets, engagement, follower growth)",
};

function extractGoalText(messages: UIMessage[]): string {
  return messages
    .filter((m) => m.role === "user")
    .map((m) => {
      if (m.parts) {
        return m.parts
          .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
          .map((p) => p.text)
          .join(" ");
      }
      return "";
    })
    .join(" ")
    .toLowerCase();
}

// Always includes twitter (public accountability pledge).
// Adds other toolkits based on keywords in the goal text.
// Telegram is intentionally excluded — it uses custom tools with our own bot.
function selectToolkits(goalText: string): string[] {
  const selected = new Set(["twitter"]);

  for (const [toolkit, keywords] of Object.entries(TOOLKIT_KEYWORD_MAP)) {
    if (keywords.some((kw) => goalText.includes(kw))) {
      selected.add(toolkit);
    }
  }

  return Array.from(selected);
}

// Checks which of the given toolkits have an ACTIVE connected account for this user.
async function getConnectedToolkits(
  composio: Composio,
  userId: string,
  toolkits: string[]
): Promise<{ connected: string[]; disconnected: string[] }> {
  try {
    const accounts = await composio.connectedAccounts.list({
      userIds: [userId],
      toolkitSlugs: toolkits,
      statuses: ["ACTIVE"],
    });

    const connectedSlugs = new Set(
      (accounts.items ?? []).map((item) => item.toolkit.slug)
    );

    return {
      connected: toolkits.filter((t) => connectedSlugs.has(t)),
      disconnected: toolkits.filter((t) => !connectedSlugs.has(t)),
    };
  } catch (error) {
    console.error("Failed to check connected accounts:", error);
    // Fail open — treat all as disconnected so the agent prompts for connection
    return { connected: [], disconnected: toolkits };
  }
}

function buildSystemPrompt(
  telegramChannelId: string,
  connectedToolkits: string[],
  disconnectedToolkits: string[]
) {
  const connectedPlatformsList = connectedToolkits.length
    ? connectedToolkits.map((t) => `- ${TOOLKIT_LABELS[t] ?? t} ✅ CONNECTED`).join("\n")
    : "- None connected yet";

  const disconnectedPlatformsList = disconnectedToolkits
    .filter((t) => t !== "twitter")
    .map((t) => {
      const label = TOOLKIT_LABELS[t]?.split(" ")[0] ?? t;
      return `- ${TOOLKIT_LABELS[t] ?? t} ❌ NOT CONNECTED — generate a connection URL and present it as: **[🔗 Connect your ${label} here](URL)**`;
    })
    .join("\n");

  const verifiablePlatforms = connectedToolkits
    .filter((t) => t !== "telegram")
    .map((t) => `- ${TOOLKIT_LABELS[t] ?? t}`)
    .join("\n");

  const twitterConnected = connectedToolkits.includes("twitter");

  return `You are the STFU & Execute AI — a brutally honest accountability agent.

YOUR PERSONALITY:
- Direct, no-nonsense, slightly aggressive motivator
- You don't sugarcoat anything
- You call out vague goals and force specificity
- You celebrate wins but always push for more

YOUR TOOLS FOR TELEGRAM (use these, not any Composio Telegram tools):
- SEND_STFU_CHALLENGE_MESSAGE — sends a message to the public STFU community Telegram group.

VERIFIED CONNECTION STATUS (checked live against Composio before this session started):
${connectedPlatformsList}
${disconnectedPlatformsList || ""}

YOUR JOB — THE CHALLENGE FLOW:

## STEP 1: GOAL ANALYSIS
When a user defines their goal and stake amount, analyze it critically.
- If the goal is vague, demand specifics.
- If no deadline/timeframe is mentioned, ASK for one. Do NOT proceed without a timeframe.
- If no stake amount is mentioned, ASK for one.

## STEP 2: TASK BREAKDOWN
Once you have a clear goal + timeframe + stake:
- Break the goal into concrete, verifiable tasks with a checklist.
- Each task should be measurable and verifiable.
- Present them as a numbered checklist the user can review.
- Ask the user to confirm or adjust the tasks.

## STEP 3: ANNOUNCE CHALLENGE TO THE STFU COMMUNITY
**This step happens IMMEDIATELY after the user confirms the task list. Do this BEFORE anything else.**

3a. Call SEND_STFU_CHALLENGE_MESSAGE with:
    - message: Format this exactly as:
      🔥 <b>NEW CHALLENGE ALERT</b> 🔥

      🎯 <b>Goal:</b> [the user's goal]
      ⏰ <b>Deadline:</b> [timeframe]
      💰 <b>Stakes:</b> [stake amount]
      📊 <b>Tracking:</b> [platforms being verified, e.g. GitHub, Instagram]

      ✅ <b>Tasks:</b>
      1. [task 1]
      2. [task 2]
      ...

      The pressure is on. Let's see if they crash and burn. 🍿

3b. After sending the message, show the user:
    "Your challenge is LIVE in the STFU public group. The pressure just got real."

## STEP 4: TWITTER ACCOUNTABILITY PLEDGE
**This step happens IMMEDIATELY after the Telegram message is sent.**

4a. Compose the tweet: "I'm committing to [goal] in [timeframe]. Stakes: [stake]. No excuses. #STFUandExecute"
    Keep it under 280 characters. Make it punchy and specific.

4b. Show the tweet and ask "Want me to post this? Say yes to lock it in."

4c. When approved:
${twitterConnected
    ? "    - Twitter IS connected. Use the Twitter tool to post the tweet directly."
    : "    - Twitter is NOT connected. Generate a connection URL and present it as: **[🔗 Connect your Twitter/X account here](URL)**"}

4d. After the tweet is posted, call SEND_STFU_CHALLENGE_MESSAGE with:
    - message: "🐦 Accountability tweet posted. The internet is watching. No backing out now."

## STEP 5: CONNECT REMAINING VERIFICATION PLATFORMS
**This step happens IMMEDIATELY after the tweet is posted.**
${disconnectedToolkits.filter((t) => t !== "twitter").length === 0
    ? "All verification platforms are already connected. Skip this step."
    : `Connect the platforms that still need authentication:\n${disconnectedPlatformsList}`}

Once all platforms are connected (or if none needed), call SEND_STFU_CHALLENGE_MESSAGE:
    - message: "✅ All accounts connected. The challenge is fully LIVE. I'm watching. Don't embarrass yourself."

Then tell the user: "Challenge is live. Come back when you have progress to show."

## STEP 6: VERIFICATION (when user returns to check progress)
When the user asks to verify progress:
${verifiablePlatforms
    ? `- Use ONLY the tools for these CONFIRMED connected platforms:\n${verifiablePlatforms}`
    : "- No platforms are connected yet. Tell the user to connect their accounts first."}
- Compare evidence against the task checklist.
- Verdict: COMPLETED ✅ / IN PROGRESS 🔄 / FAILED ❌
- Be specific — name commits, post URLs, follower numbers, dates. No vague statements.

Then call SEND_STFU_CHALLENGE_MESSAGE with:
    - message: Format it as:
      📊 <b>CHALLENGE UPDATE</b>

      Verdict: [COMPLETED ✅ / IN PROGRESS 🔄 / FAILED ❌]

      <b>Evidence:</b>
      [bullet points of what you actually found]

      <b>Tasks:</b>
      [each task: ✅ done / ❌ not done / 🔄 partial]

      [One brutally honest closing sentence]

IMPORTANT RULES:
- ALWAYS present Composio connection URLs as clickable markdown links, never as raw text.
- Follow steps IN ORDER. Telegram announcement FIRST.
- For Telegram: use SEND_STFU_CHALLENGE_MESSAGE — NOT any Composio Telegram tools.
- NEVER attempt to use a tool for a platform listed as ❌ NOT CONNECTED above — generate its connection URL instead.
- Be concise. No fluff. Execute.

TONE EXAMPLES:
- "That's not a goal, that's a wish. Give me specifics."
- "30 reels in 30 days? Zero posted so far. The deadline is in 3 days. You're done."
- "7 commits in 3 days? You actually showed up. Respect."`;
}

// Custom Telegram tools that call our bot directly — no per-user auth required.
const telegramTools = {
  SEND_STFU_CHALLENGE_MESSAGE: tool({
    description:
      "Sends a message or update to the STFU community Telegram group.",
    inputSchema: jsonSchema<{ message: string }>({
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "The HTML-formatted message to post in the group.",
        },
      },
      required: ["message"],
    }),
    execute: async ({ message }: { message: string }) => {
      await sendChallengeMessage(message);
      return { success: true };
    },
  }),
};

const chatRequestSchema = z.object({
  messages: z.array(z.any()).min(1).max(100),
});

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  let userId: string;
  try {
    const claims = await privy.verifyAuthToken(token);
    userId = claims.userId;
  } catch (error) {
    console.error("Token verification failed:", error);
    return new Response("Unauthorized", { status: 401 });
  }

  if (!checkRateLimit(userId)) {
    return new Response("Too Many Requests", { status: 429 });
  }

  let client: Awaited<ReturnType<typeof experimental_createMCPClient>> | null = null;

  try {
    const body = await req.json();
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response("Invalid request body", { status: 400 });
    }

    const messages = parsed.data.messages as UIMessage[];
    const model = getModel("gpt-4o");

    // Detect relevant toolkits from the user's goal text.
    // Telegram is excluded — it uses our custom tools above.
    const goalText = extractGoalText(messages);
    const toolkits = selectToolkits(goalText);

    const composio = new Composio({
      apiKey: env.COMPOSIO_API_KEY,
    });

    const callbackUrl = env.AUTH_URL
      ? `${env.AUTH_URL}/challenge`
      : "http://localhost:3000/challenge";

    // Check which toolkits the user has already connected before starting the session.
    // This gives the agent verified facts rather than letting it guess.
    const { connected: connectedToolkits, disconnected: disconnectedToolkits } =
      await getConnectedToolkits(composio, userId, toolkits);

    const toolSession = await composio.create(userId, {
      toolkits,
      manageConnections: {
        callbackUrl,
      },
    });

    client = await experimental_createMCPClient({
      transport: {
        type: "http",
        url: toolSession.mcp.url,
        headers: toolSession.mcp.headers,
      },
    });

    const mcpTools = await client.tools();
    const coreMessages = await convertToModelMessages(messages, {
      tools: { ...mcpTools, ...telegramTools },
    });

    const result = streamText({
      model,
      messages: coreMessages,
      system: buildSystemPrompt(env.TELEGRAM_CHAT_ID, connectedToolkits, disconnectedToolkits),
      tools: { ...mcpTools, ...telegramTools },
      stopWhen: stepCountIs(20),
      onFinish: async () => {
        await client?.close().catch(() => { });
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (client) {
      await client.close().catch(() => { });
    }
    console.error("Chat API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
