import { monadTestnet } from "./chain";
import { VAULT_ABI, MARKET_ABI } from "./abi";

export const VAULT_ADDRESS  = (process.env.NEXT_PUBLIC_VAULT_ADDRESS  ?? "0x6aE731EbaC64f1E9c6A721eA2775028762830CF7") as `0x${string}`;
export const MARKET_ADDRESS = (process.env.NEXT_PUBLIC_MARKET_ADDRESS ?? "0x637224F6460A5Bc3FE0B873e4361288ba7Ac3883") as `0x${string}`;
export const USDC_ADDRESS   = (process.env.NEXT_PUBLIC_USDC_ADDRESS   ?? "0x61d11C622Bd98A71aD9361833379A2066Ad29CCa") as `0x${string}`;
export const CHAIN_ID       = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 10143);

export const vaultContract = {
  address: VAULT_ADDRESS,
  abi:     VAULT_ABI,
  chain:   monadTestnet,
} as const;

export const marketContract = {
  address: MARKET_ADDRESS,
  abi:     MARKET_ABI,
  chain:   monadTestnet,
} as const;

/** Token enum mirrors Solidity: 0 = NATIVE, 1 = USDC */
export const TokenType = { NATIVE: 0, USDC: 1 } as const;
export type TokenType = (typeof TokenType)[keyof typeof TokenType];
