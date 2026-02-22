"use client";

import { createPublicClient, http } from "viem";
import { monadTestnet } from "./chain";

// Singleton read-only client — no wallet needed.
// Safe to import in both server and client components.
export const publicClient = createPublicClient({
  chain:     monadTestnet,
  transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz"),
});
