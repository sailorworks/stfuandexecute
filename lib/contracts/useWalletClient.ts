"use client";

import { useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom } from "viem";
import { monadTestnet } from "./chain";

/**
 * Returns a factory that builds a viem WalletClient backed by the user's
 * Privy wallet (embedded or external). Switches to Monad testnet automatically.
 */
export function useSTFUWalletClient() {
  const { wallets } = useWallets();
  const wallet = wallets[0]; // Privy sorts active wallet first

  const getClient = async () => {
    if (!wallet) throw new Error("No wallet connected");
    // Switch to Monad testnet if on a different chain
    await wallet.switchChain(monadTestnet.id);
    const provider = await wallet.getEthereumProvider();
    return createWalletClient({
      account:   wallet.address as `0x${string}`,
      chain:     monadTestnet,
      transport: custom(provider),
    });
  };

  return { getClient, address: wallet?.address as `0x${string}` | undefined };
}
