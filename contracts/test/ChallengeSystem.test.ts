import { expect } from "chai";
import { ethers } from "hardhat";
import { ChallengeVault, PredictionMarket, MyMockUSDC } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Challenge System (Vault + Market)", function () {
    let vault: ChallengeVault;
    let market: PredictionMarket;
    let usdc: MyMockUSDC;
    let oracle: HardhatEthersSigner;
    let challenger: HardhatEthersSigner;
    let bettorPass: HardhatEthersSigner;
    let bettorFail: HardhatEthersSigner;
    let treasury: HardhatEthersSigner;

    const ONE_MON = ethers.parseEther("1");
    const MIN_MON = ethers.parseEther("0.001");
    const TEN_USDC = ethers.parseUnits("10", 6);
    const GOAL_HASH = ethers.keccak256(ethers.toUtf8Bytes("Test Goal"));

    // Match Solidity enums
    enum Token { NATIVE, USDC }

    beforeEach(async function () {
        [oracle, challenger, bettorPass, bettorFail, treasury] = await ethers.getSigners();

        // 1. Deploy Mock USDC
        const MockUSDC = await ethers.getContractFactory("MyMockUSDC");
        usdc = await MockUSDC.deploy();
        await usdc.waitForDeployment();

        // 2. Precompute addresses for circular dependency
        const nonce = await ethers.provider.getTransactionCount(oracle.address);
        const vaultAddr = ethers.getCreateAddress({ from: oracle.address, nonce });
        const marketAddr = ethers.getCreateAddress({ from: oracle.address, nonce: nonce + 1 });

        // 3. Deploy contracts
        const VaultFactory = await ethers.getContractFactory("ChallengeVault");
        vault = await VaultFactory.deploy(oracle.address, marketAddr, treasury.address, await usdc.getAddress());
        await vault.waitForDeployment();

        const MarketFactory = await ethers.getContractFactory("PredictionMarket");
        market = await MarketFactory.deploy(vaultAddr, await usdc.getAddress(), treasury.address);
        await market.waitForDeployment();

        // 4. Setup balances
        await usdc.mint(challenger.address, TEN_USDC * 10n);
        await usdc.mint(bettorPass.address, TEN_USDC * 10n);
        await usdc.mint(bettorFail.address, TEN_USDC * 10n);

        await usdc.connect(challenger).approve(vaultAddr, ethers.MaxUint256);
        await usdc.connect(bettorPass).approve(marketAddr, ethers.MaxUint256);
        await usdc.connect(bettorFail).approve(marketAddr, ethers.MaxUint256);
    });

    describe("Challenge Creation", function () {
        it("should create native challenge", async function () {
            const deadline = (await time.latest()) + 3600;
            await vault.connect(challenger).createChallenge(GOAL_HASH, deadline, Token.NATIVE, 0, { value: ONE_MON });

            const c = await vault.getChallenge(0);
            expect(c.challenger).to.equal(challenger.address);
            expect(c.stake).to.equal(ONE_MON);
            expect(c.token).to.equal(Token.NATIVE);
        });

        it("should create USDC challenge", async function () {
            const deadline = (await time.latest()) + 3600;
            await vault.connect(challenger).createChallenge(GOAL_HASH, deadline, Token.USDC, TEN_USDC);

            const c = await vault.getChallenge(0);
            expect(c.stake).to.equal(TEN_USDC);
            expect(c.token).to.equal(Token.USDC);
        });
    });

    describe("Resolution & Payouts", function () {
        let deadline: number;

        beforeEach(async function () {
            deadline = (await time.latest()) + 3600;
            await vault.connect(challenger).createChallenge(GOAL_HASH, deadline, Token.NATIVE, 0, { value: ONE_MON });

            // Bets: bettorPass 1 MON on pass, bettorFail 1 MON on fail
            await market.connect(bettorPass).placeBet(0, true, Token.NATIVE, 0, { value: ONE_MON });
            await market.connect(bettorFail).placeBet(0, false, Token.NATIVE, 0, { value: ONE_MON });
        });

        it("should handle PASS resolution", async function () {
            const chalBefore = await ethers.provider.getBalance(challenger.address);
            const treasuryBefore = await ethers.provider.getBalance(treasury.address);

            await vault.connect(oracle).resolve(0, true);

            // Challenger gets stake back
            expect(await ethers.provider.getBalance(challenger.address)).to.equal(chalBefore + ONE_MON);

            // Treasury gets fee from LOSING pool (5% of 1 MON = 0.05 MON)
            expect(await ethers.provider.getBalance(treasury.address)).to.equal(treasuryBefore + ethers.parseEther("0.05"));

            // Winner claims: 1 (own bet) + 0.95 (losing pool after fee) = 1.95 MON
            const winnerBefore = await ethers.provider.getBalance(bettorPass.address);
            const tx = await market.connect(bettorPass).claimWinnings(0, Token.NATIVE);
            const receipt = await tx.wait();
            const gas = receipt!.gasUsed * receipt!.gasPrice;

            expect(await ethers.provider.getBalance(bettorPass.address)).to.equal(winnerBefore + ethers.parseEther("1.95") - gas);
        });

        it("should handle FAIL resolution", async function () {
            const treasuryBefore = await ethers.provider.getBalance(treasury.address);

            await vault.connect(oracle).resolve(0, false);

            // Treasury gets: 5% of challenger stake (0.05) + 5% of losing pool (0.05) = 0.1 MON
            expect(await ethers.provider.getBalance(treasury.address)).to.equal(treasuryBefore + ethers.parseEther("0.1"));

            // Winner claims: 1 (own bet) + 0.95 (losing pool) + 0.95 (slashed stake) = 2.9 MON
            const winnerBefore = await ethers.provider.getBalance(bettorFail.address);
            const tx = await market.connect(bettorFail).claimWinnings(0, Token.NATIVE);
            const receipt = await tx.wait();
            const gas = receipt!.gasUsed * receipt!.gasPrice;

            expect(await ethers.provider.getBalance(bettorFail.address)).to.equal(winnerBefore + ethers.parseEther("2.9") - gas);
        });
    });
});
