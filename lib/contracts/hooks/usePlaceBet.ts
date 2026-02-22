"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { parseEventLogs } from "viem";
import { useSTFUWalletClient } from "../useWalletClient";
import { publicClient } from "../publicClient";
import { marketContract, USDC_ADDRESS, TokenType } from "../config";
import { ERC20_ABI, MARKET_ABI } from "../abi";

interface PlaceBetParams {
  contractChallengeId: string;   // uint256 decimal string
  betPass:             boolean;
  token:               typeof TokenType[keyof typeof TokenType];
  amount:              bigint;
}

export function usePlaceBet() {
  const { getAccessToken } = usePrivy();
  const { getClient, address } = useSTFUWalletClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const placeBet = async (params: PlaceBetParams) => {
    setIsPending(true);
    setError(null);

    try {
      const client     = await getClient();
      const challengeId = BigInt(params.contractChallengeId);

      // USDC: approve market to spend
      if (params.token === TokenType.USDC) {
        const approveTx = await client.writeContract({
          address:      USDC_ADDRESS,
          abi:          ERC20_ABI,
          functionName: "approve",
          args:         [marketContract.address, params.amount],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
      }

      const fn   = params.betPass ? "betPass" : "betFail";
      const hash = await client.writeContract({
        ...marketContract,
        functionName: fn,
        args:  [challengeId, params.token === TokenType.USDC ? params.amount : 0n],
        value: params.token === TokenType.NATIVE ? params.amount : 0n,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Record in DB
      const privyToken = await getAccessToken();
      if (privyToken && address) {
        await fetch("/api/contracts/place-bet", {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${privyToken}` },
          body:    JSON.stringify({
            contractChallengeId: params.contractChallengeId,
            betPass:             params.betPass,
            amount:              params.amount.toString(),
            token:               params.token === TokenType.NATIVE ? "native" : "usdc",
            txHash:              hash,
            walletAddress:       address,
          }),
        });
      }

      return { hash, receipt };
    } catch (err: any) {
      const msg = err?.shortMessage ?? err?.message ?? "Transaction failed";
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { placeBet, isPending, error };
}
