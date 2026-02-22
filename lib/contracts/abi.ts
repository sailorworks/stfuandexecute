// Auto-generated from contracts/artifacts/contracts/ChallengeVault.sol/ChallengeVault.json
// Run: npx hardhat compile  (inside contracts/) then copy the abi array here.

export const VAULT_ABI = [
  { "type": "constructor", "inputs": [ { "name": "_oracle", "type": "address" }, { "name": "_predictionMarket", "type": "address" }, { "name": "_treasury", "type": "address" }, { "name": "_usdc", "type": "address" } ], "stateMutability": "nonpayable" },
  { "type": "function", "name": "PLATFORM_CUT_BPS", "inputs": [], "outputs": [ { "name": "", "type": "uint256" } ], "stateMutability": "view" },
  { "type": "function", "name": "REFUND_GRACE", "inputs": [], "outputs": [ { "name": "", "type": "uint256" } ], "stateMutability": "view" },
  { "type": "function", "name": "MIN_STAKE_NATIVE", "inputs": [], "outputs": [ { "name": "", "type": "uint256" } ], "stateMutability": "view" },
  { "type": "function", "name": "MIN_STAKE_USDC", "inputs": [], "outputs": [ { "name": "", "type": "uint256" } ], "stateMutability": "view" },
  { "type": "function", "name": "nextChallengeId", "inputs": [], "outputs": [ { "name": "", "type": "uint256" } ], "stateMutability": "view" },
  { "type": "function", "name": "oracle", "inputs": [], "outputs": [ { "name": "", "type": "address" } ], "stateMutability": "view" },
  { "type": "function", "name": "predictionMarket", "inputs": [], "outputs": [ { "name": "", "type": "address" } ], "stateMutability": "view" },
  { "type": "function", "name": "treasury", "inputs": [], "outputs": [ { "name": "", "type": "address" } ], "stateMutability": "view" },
  { "type": "function", "name": "usdc", "inputs": [], "outputs": [ { "name": "", "type": "address" } ], "stateMutability": "view" },
  { "type": "function", "name": "challenges", "inputs": [ { "name": "", "type": "uint256" } ], "outputs": [ { "name": "challenger", "type": "address" }, { "name": "stake", "type": "uint256" }, { "name": "goalHash", "type": "bytes32" }, { "name": "deadline", "type": "uint64" }, { "name": "createdAt", "type": "uint64" }, { "name": "token", "type": "uint8" }, { "name": "status", "type": "uint8" } ], "stateMutability": "view" },
  { "type": "function", "name": "getChallenge", "inputs": [ { "name": "challengeId", "type": "uint256" } ], "outputs": [ { "name": "", "type": "tuple", "components": [ { "name": "challenger", "type": "address" }, { "name": "stake", "type": "uint256" }, { "name": "goalHash", "type": "bytes32" }, { "name": "deadline", "type": "uint64" }, { "name": "createdAt", "type": "uint64" }, { "name": "token", "type": "uint8" }, { "name": "status", "type": "uint8" } ] } ], "stateMutability": "view" },
  { "type": "function", "name": "createChallenge", "inputs": [ { "name": "goalHash", "type": "bytes32" }, { "name": "deadline", "type": "uint64" }, { "name": "token", "type": "uint8" }, { "name": "usdcAmount", "type": "uint256" } ], "outputs": [ { "name": "challengeId", "type": "uint256" } ], "stateMutability": "payable" },
  { "type": "function", "name": "claimRefund", "inputs": [ { "name": "challengeId", "type": "uint256" } ], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "resolve", "inputs": [ { "name": "challengeId", "type": "uint256" }, { "name": "passed", "type": "bool" } ], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "setOracle", "inputs": [ { "name": "_oracle", "type": "address" } ], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "setTreasury", "inputs": [ { "name": "_treasury", "type": "address" } ], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "pause", "inputs": [], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "unpause", "inputs": [], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "function", "name": "owner", "inputs": [], "outputs": [ { "name": "", "type": "address" } ], "stateMutability": "view" },
  { "type": "event", "name": "ChallengeCreated", "inputs": [ { "name": "challengeId", "type": "uint256", "indexed": true }, { "name": "challenger", "type": "address", "indexed": true }, { "name": "stake", "type": "uint256", "indexed": false }, { "name": "token", "type": "uint8", "indexed": false }, { "name": "goalHash", "type": "bytes32", "indexed": false }, { "name": "deadline", "type": "uint64", "indexed": false } ] },
  { "type": "event", "name": "ChallengeResolved", "inputs": [ { "name": "challengeId", "type": "uint256", "indexed": true }, { "name": "passed", "type": "bool", "indexed": false }, { "name": "returnedToChallenger", "type": "uint256", "indexed": false }, { "name": "sentToMarket", "type": "uint256", "indexed": false }, { "name": "platformFee", "type": "uint256", "indexed": false } ] },
  { "type": "event", "name": "RefundClaimed", "inputs": [ { "name": "challengeId", "type": "uint256", "indexed": true }, { "name": "amount", "type": "uint256", "indexed": false } ] },
] as const;

export const MARKET_ABI = [
  { "type": "constructor", "inputs": [ { "name": "_vault", "type": "address" }, { "name": "_treasury", "type": "address" }, { "name": "_usdc", "type": "address" } ], "stateMutability": "nonpayable" },
  { "type": "function", "name": "PLATFORM_CUT_BPS", "inputs": [], "outputs": [ { "name": "", "type": "uint256" } ], "stateMutability": "view" },
  { "type": "function", "name": "markets", "inputs": [ { "name": "", "type": "uint256" } ], "outputs": [ { "name": "totalPassBets", "type": "uint256" }, { "name": "totalFailBets", "type": "uint256" }, { "name": "slashedStake", "type": "uint256" }, { "name": "protocolFee", "type": "uint256" }, { "name": "status", "type": "uint8" }, { "name": "token", "type": "uint8" } ], "stateMutability": "view" },
  { "type": "function", "name": "getMarket", "inputs": [ { "name": "challengeId", "type": "uint256" } ], "outputs": [ { "name": "", "type": "tuple", "components": [ { "name": "totalPassBets", "type": "uint256" }, { "name": "totalFailBets", "type": "uint256" }, { "name": "slashedStake", "type": "uint256" }, { "name": "protocolFee", "type": "uint256" }, { "name": "status", "type": "uint8" }, { "name": "token", "type": "uint8" } ] } ], "stateMutability": "view" },
  { "type": "function", "name": "getMyBets", "inputs": [ { "name": "challengeId", "type": "uint256" }, { "name": "user", "type": "address" } ], "outputs": [ { "name": "onPass", "type": "uint256" }, { "name": "onFail", "type": "uint256" } ], "stateMutability": "view" },
  { "type": "function", "name": "calculatePayout", "inputs": [ { "name": "challengeId", "type": "uint256" }, { "name": "user", "type": "address" } ], "outputs": [ { "name": "", "type": "uint256" } ], "stateMutability": "view" },
  { "type": "function", "name": "betPass", "inputs": [ { "name": "challengeId", "type": "uint256" }, { "name": "usdcAmount", "type": "uint256" } ], "outputs": [], "stateMutability": "payable" },
  { "type": "function", "name": "betFail", "inputs": [ { "name": "challengeId", "type": "uint256" }, { "name": "usdcAmount", "type": "uint256" } ], "outputs": [], "stateMutability": "payable" },
  { "type": "function", "name": "claimWinnings", "inputs": [ { "name": "challengeId", "type": "uint256" } ], "outputs": [], "stateMutability": "nonpayable" },
  { "type": "event", "name": "BetPlaced", "inputs": [ { "name": "challengeId", "type": "uint256", "indexed": true }, { "name": "bettor", "type": "address", "indexed": true }, { "name": "betOnPass", "type": "bool", "indexed": false }, { "name": "amount", "type": "uint256", "indexed": false } ] },
  { "type": "event", "name": "MarketResolved", "inputs": [ { "name": "challengeId", "type": "uint256", "indexed": true }, { "name": "passed", "type": "bool", "indexed": false }, { "name": "slashedStake", "type": "uint256", "indexed": false }, { "name": "protocolFee", "type": "uint256", "indexed": false } ] },
  { "type": "event", "name": "WinningsClaimed", "inputs": [ { "name": "challengeId", "type": "uint256", "indexed": true }, { "name": "bettor", "type": "address", "indexed": true }, { "name": "amount", "type": "uint256", "indexed": false } ] },
] as const;

export const ERC20_ABI = [
  { "type": "function", "name": "approve", "inputs": [ { "name": "spender", "type": "address" }, { "name": "amount", "type": "uint256" } ], "outputs": [ { "name": "", "type": "bool" } ], "stateMutability": "nonpayable" },
  { "type": "function", "name": "allowance", "inputs": [ { "name": "owner", "type": "address" }, { "name": "spender", "type": "address" } ], "outputs": [ { "name": "", "type": "uint256" } ], "stateMutability": "view" },
  { "type": "function", "name": "balanceOf", "inputs": [ { "name": "account", "type": "address" } ], "outputs": [ { "name": "", "type": "uint256" } ], "stateMutability": "view" },
  { "type": "function", "name": "decimals", "inputs": [], "outputs": [ { "name": "", "type": "uint8" } ], "stateMutability": "view" },
] as const;
