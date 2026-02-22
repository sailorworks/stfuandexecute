import { ethers } from "hardhat";

async function main() {
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Deployer:", deployer.address);
        const bal = await ethers.provider.getBalance(deployer.address);
        console.log("Balance:", ethers.formatEther(bal), "MON");

        const network = await ethers.provider.getNetwork();
        console.log("Network:", network.name, "ChainId:", network.chainId.toString());
    } catch (e: any) {
        console.error("Connection failed:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
