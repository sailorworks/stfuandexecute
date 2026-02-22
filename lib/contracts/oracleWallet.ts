// Server-side only — never import this in client components.
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "./chain";
import { VAULT_ABI } from "./abi";
import { VAULT_ADDRESS } from "./config";

const RPC = process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz";

function getOracleAccount() {
  const pk = process.env.ORACLE_PRIVATE_KEY;
  if (!pk) throw new Error("ORACLE_PRIVATE_KEY is not set");
  return privateKeyToAccount(pk as `0x${string}`);
}

export function getOracleWalletClient() {
  return createWalletClient({
    account:   getOracleAccount(),
    chain:     monadTestnet,
    transport: http(RPC),
  });
}

export function getOraclePublicClient() {
  return createPublicClient({
    chain:     monadTestnet,
    transport: http(RPC),
  });
}

/**
 * Calls ChallengeVault.resolve(challengeId, passed) from the oracle wallet.
 * @param contractChallengeId  The uint256 challenge ID (decimal string from DB).
 * @param passed               True = challenge succeeded.
 */
export async function oracleResolve(contractChallengeId: string, passed: boolean) {
  const walletClient = getOracleWalletClient();
  const publicClient = getOraclePublicClient();

  const hash = await walletClient.writeContract({
    address:      VAULT_ADDRESS,
    abi:          VAULT_ABI,
    functionName: "resolve",
    args:         [BigInt(contractChallengeId), passed],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, receipt };
}
