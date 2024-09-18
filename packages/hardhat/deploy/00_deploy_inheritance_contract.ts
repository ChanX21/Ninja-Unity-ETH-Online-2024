import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, ethers } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const initialHeir = deployer; // You can change this to any address

    const deployResult = await deploy("InheritanceContract", {
        from: deployer,
        args: [initialHeir],
        log: true,
    });

    // Verify the contract to ensure all functions are recognized
    if (deployResult.newlyDeployed) {
        const InheritanceContract = await ethers.getContractFactory("InheritanceContract");
        const contract = InheritanceContract.attach(deployResult.address);

        console.log("Contract deployed at:", deployResult.address);
        console.log("Owner:", await contract.owner());
        console.log("Heir:", await contract.heir());
        console.log("Time left before heir ownership:", await contract.getTimeLeftBeforeHeirOwnership());
        console.log("Time left in days:", await contract.getTimeLeftInDays());
        console.log("Can heir claim ownership:", await contract.canHeirClaimOwnership());
    }
};

export default func;
func.tags = ["InheritanceContract"];