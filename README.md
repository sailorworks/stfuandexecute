# STFU & Execute

> **Shut up. Stake up. Ship it.** — A Web3 AI accountability platform where you put your money where your mouth is.

## 🧠 What Is This?

**STFU & Execute** is a crypto-native accountability platform built on [Monad](https://monad.xyz). Set a personal challenge, lock your stake on-chain, and let AI track whether you actually follow through. Friends (or strangers) can bet on your success or failure in a built-in prediction market. If you win, you get your stake back. If you quit, your money goes to the people who bet against you.

## ✨ Key Features

- **🔒 Stake & Challenge** — Create a goal, set a deadline, and lock MON or USDC into the `ChallengeVault` smart contract. No takebacks.
- **📈 Prediction Market** — Anyone can bet on whether a challenger will pass or fail via the `PredictionMarket` contract. Winners split the losing pool.
- **🤖 AI Accountability Agent** — An AI coach (powered by OpenAI via Vercel AI SDK) monitors your progress, asks tough questions, and calls you out.
- **📲 Telegram Nudges** — The AI sends reminders and check-ins to a dedicated Telegram topic for each challenge.
- **🏆 Arena & Leaderboard** — Browse active challenges, see who's shipping, and climb the leaderboard.
- **🔐 Wallet Auth** — Seamless login via [Privy](https://privy.io) — supports email, socials, and embedded wallets.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js Frontend                  │
│  Landing · Challenge · Arena · Leaderboard · Insights│
├─────────────────────────────────────────────────────┤
│              API Routes (Next.js App Router)        │
│   /api/auth · /api/chat · /api/challenges           │
│   /api/contracts (create, resolve, ai-verdict)      │
├──────────────────┬──────────────────────────────────┤
│   Supabase (DB)  │     Monad Testnet (Chain ID 10143) │
│   via Drizzle ORM│  ChallengeVault · PredictionMarket │
├──────────────────┴──────────────────────────────────┤
│        Telegram Bot  ·  OpenAI (AI SDK)  ·  Privy   │
└─────────────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer         | Technology                                      |
|---------------|--------------------------------------------------|
| **Framework** | Next.js 16 (App Router, React 19)               |
| **Styling**   | Tailwind CSS 4, Framer Motion                   |
| **Auth**      | Privy (embedded wallets + social login)          |
| **Database**  | Supabase (Postgres) + Drizzle ORM               |
| **AI**        | Vercel AI SDK + OpenAI                           |
| **Messaging** | Telegram Bot API (`node-telegram-bot-api`)       |
| **Contracts** | Solidity 0.8.24, Hardhat, OpenZeppelin          |
| **Chain**     | Monad Testnet (Chain ID: 10143)                  |

## 📦 Smart Contracts

### `ChallengeVault.sol`
The core vault where challengers lock their stake. An oracle resolves challenges:
- ✅ **Pass** → Full stake returned to the challenger.
- ❌ **Fail** → 5% to treasury, 95% forwarded to the `PredictionMarket` for winners.
- ⏰ **Safety valve** → If the oracle never resolves, the challenger can reclaim after 30 days.

### `PredictionMarket.sol`
A peer-to-peer betting market for each challenge:
- Anyone can bet **PASS** or **FAIL** using MON or USDC.
- On resolution, winners claim their bet back + a proportional share of the losing pool (minus protocol fee).

**Deployed Addresses (Monad Testnet):**
| Contract          | Address                                      |
|-------------------|----------------------------------------------|
| ChallengeVault    | `0x6aE731EbaC64f1E9c6A721eA2775028762830CF7` |
| PredictionMarket  | `0x637224F6460A5Bc3FE0B873e4361288ba7Ac3883` |
| USDC (Mock)       | `0x61d11C622Bd98A71aD9361833379A2066Ad29CCa` |

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- [Bun](https://bun.sh) (recommended) or npm
- A [Privy](https://privy.io) app
- A [Supabase](https://supabase.com) project
- OpenAI API key
- Telegram Bot token (from [@BotFather](https://t.me/BotFather))

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/monad-blitz-mumbai.git
cd monad-blitz-mumbai
bun install        # or: npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
# ── Auth ──────────────────────────────────────────
AUTH_SECRET=<random-secret>
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
PRIVY_APP_ID=<your-privy-app-id>
PRIVY_APP_SECRET=<your-privy-app-secret>

# ── AI ────────────────────────────────────────────
OPENAI_API_KEY=<your-openai-key>
COMPOSIO_API_KEY=<your-composio-key>

# ── Database ──────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-supabase-anon-key>
DATABASE_URL=<postgres-connection-string>
DIRECT_URL=<postgres-direct-connection-string>

# ── Telegram ──────────────────────────────────────
TELEGRAM_BOT_TOKEN=<your-bot-token>
TELEGRAM_CHAT_ID=<your-supergroup-id>

# ── Contracts (optional for oracle) ───────────────
ORACLE_PRIVATE_KEY=<oracle-wallet-private-key>
ORACLE_WEBHOOK_SECRET=<shared-secret>
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

### 3. Run the Dev Server

```bash
bun dev            # or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 4. Deploy Contracts (optional)

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.ts --network monadTestnet
```

## 📁 Project Structure

```
├── app/
│   ├── api/              # API routes (auth, chat, challenges, contracts)
│   ├── arena/            # Browse active challenges
│   ├── challenge/        # Create/view challenges
│   ├── components/       # Shared UI (Nav, StakeModal, PredictionPanel)
│   ├── insights/         # AI-powered progress insights
│   ├── leaderboard/      # Rankings
│   ├── mission/          # Mission page
│   ├── onboarding/       # User onboarding flow
│   └── page.tsx          # Landing page (brutalist hero)
├── contracts/
│   └── contracts/        # Solidity source (ChallengeVault, PredictionMarket)
├── lib/
│   ├── contracts/        # ABIs, chain config, hooks, wallet client
│   ├── db/               # Drizzle schema & client
│   ├── hooks/            # Custom React hooks
│   ├── env.ts            # Validated env vars (Zod)
│   └── telegram.ts       # Telegram bot helper
└── supabase/             # Supabase migrations & config
```

## 🔄 How It Works

1. **Sign in** via Privy (email, wallet, or social).
2. **Create a Challenge** — describe your goal, set a deadline, choose MON or USDC, and stake your amount.
3. **The AI watches** — check in with the AI agent, which tracks progress and sends Telegram nudges.
4. **Others bet** — anyone can place bets on the prediction market for your challenge.
5. **Resolution** — the oracle (AI-assisted verdict) resolves the challenge on-chain.
6. **Payout** — winners collect from the vault and prediction market. Quitters lose their stake.

## 📜 License

MIT

---

<p align="center">
  <strong>Built for Monad Blitz Mumbai 🇮🇳</strong>
</p>