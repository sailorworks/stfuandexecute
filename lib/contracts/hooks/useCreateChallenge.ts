"use client";

import { useState } from "react";
import { keccak256, toHex, parseEventLogs } from "viem";
import { usePrivy } from "@privy-io/react-auth";
import { useSTFUWalletClient } from "../useWalletClient";
import { publicClient } from "../publicClient";
import { vaultContract, USDC_ADDRESS, TokenType } from "../config";
import { ERC20_ABI, VAULT_ABI } from "../abi";

interface CreateChallengeParams {
  goalText:      string;
  deadlineUnix:  number;  // seconds
  token:         typeof TokenType[keyof typeof TokenType];
  amount:        bigint;  // wei or μUSDC
  challengeDbId: string;
}

export function useCreateChallenge() {
  const { getClient, address } = useSTFUWalletClient();
  const { getAccessToken } = usePrivy();
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const createChallenge = async (params: CreateChallengeParams) => {
    setIsPending(true);
    setError(null);

    try {
      const client   = await getClient();
      const goalHash = keccak256(toHex(params.goalText));

      // USDC: approve vault to spend before creating challenge
      if (params.token === TokenType.USDC) {
        const approveTx = await client.writeContract({
          address:      USDC_ADDRESS,
          abi:          ERC20_ABI,
          functionName: "approve",
          args:         [vaultContract.address, params.amount],
        });
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
      }

      const hash = await client.writeContract({
        ...vaultContract,
        functionName: "createChallenge",
        args:  [
          goalHash as `0x${string}`,
          BigInt(params.deadlineUnix),
          params.token,
          params.token === TokenType.USDC ? params.amount : 0n,
        ],
        value: params.token === TokenType.NATIVE ? params.amount : 0n,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      // Extract contractChallengeId from ChallengeCreated event
      const logs = parseEventLogs({ abi: VAULT_ABI, logs: receipt.logs, eventName: "ChallengeCreated" });
      const contractChallengeId = logs[0]?.args.challengeId?.toString() ?? null;

      // Persist on-chain data to DB
      if (contractChallengeId) {
        const privyToken = await getAccessToken();
        await fetch("/api/contracts/create-challenge", {
          method:  "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${privyToken}` },
          body:    JSON.stringify({
            challengeDbId: params.challengeDbId,
            contractChallengeId,
            txHash:         hash,
            stakeAmount:    params.amount.toString(),
            stakeToken:     params.token === TokenType.NATIVE ? "native" : "usdc",
            deadline:       params.deadlineUnix,
            goalHash,
          }),
        });
      }

      return { hash, contractChallengeId, receipt };
    } catch (err: any) {
      const msg = err?.shortMessage ?? err?.message ?? "Transaction failed";
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { createChallenge, isPending, error, address };
}
