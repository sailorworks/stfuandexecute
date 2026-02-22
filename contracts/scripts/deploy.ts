import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "MON");

    // TODO: Replace with official Monad USDC address when available.
    // For now we deploy a MockUSDC for testnet usage.
    console.log("Deploying MockUSDC...");
    const MockUSDC = await ethers.getContractFactory("MyMockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("✅ MockUSDC deployed at:", usdcAddress);

    const ORACLE_ADDRESS = deployer.address;
    const TREASURY_ADDRESS = deployer.address;

    // Precompute addresses for mutual referencing
    const nonce = await ethers.provider.getTransactionCount(deployer.address);
    // Next transaction: ChallengeVault
    const vaultAddress = ethers.getCreateAddress({ from: deployer.address, nonce: nonce });
    // Transaction after that: PredictionMarket
    const marketAddress = ethers.getCreateAddress({ from: deployer.address, nonce: nonce + 1 });

    console.log("\nPredicted addresses:");
    console.log("  ChallengeVault:  ", vaultAddress);
    console.log("  PredictionMarket:", marketAddress);

    // 1. Deploy ChallengeVault
    const ChallengeVault = await ethers.getContractFactory("ChallengeVault");
    const vault = await ChallengeVault.deploy(ORACLE_ADDRESS, marketAddress, TREASURY_ADDRESS, usdcAddress);
    await vault.waitForDeployment();
    const vaultDeployed = await vault.getAddress();
    console.log("\n✅ ChallengeVault deployed at:", vaultDeployed);

    // 2. Deploy PredictionMarket
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const market = await PredictionMarket.deploy(vaultDeployed, usdcAddress, TREASURY_ADDRESS);
    await market.waitForDeployment();
    const marketDeployed = await market.getAddress();
    console.log("✅ PredictionMarket deployed at:", marketDeployed);

    console.log("\n📋 Deployment Summary");
    console.log("═══════════════════════════════════════════════════════");
    console.log("Network:          Monad Testnet (Chain 10143)");
    console.log("ChallengeVault:  ", vaultDeployed);
    console.log("PredictionMarket:", marketDeployed);
    console.log("USDC:            ", usdcAddress);
    console.log("Oracle:          ", ORACLE_ADDRESS);
    console.log("Treasury:        ", TREASURY_ADDRESS);
    console.log("═══════════════════════════════════════════════════════");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
