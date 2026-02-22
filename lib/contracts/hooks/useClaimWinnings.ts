"use client";

import { useState } from "react";
import { useSTFUWalletClient } from "../useWalletClient";
import { publicClient } from "../publicClient";
import { marketContract } from "../config";

export function useClaimWinnings() {
  const { getClient } = useSTFUWalletClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const claimWinnings = async (contractChallengeId: string) => {
    setIsPending(true);
    setError(null);

    try {
      const client = await getClient();
      const hash   = await client.writeContract({
        ...marketContract,
        functionName: "claimWinnings",
        args:         [BigInt(contractChallengeId)],
      });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      return { hash, receipt };
    } catch (err: any) {
      const msg = err?.shortMessage ?? err?.message ?? "Claim failed";
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { claimWinnings, isPending, error };
}
