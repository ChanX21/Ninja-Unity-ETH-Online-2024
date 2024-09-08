import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys a contract named "EscrowGameMapping" using the deployer account
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployEscrowGameMapping: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Deploy the contract
  await deploy("EscrowGameMapping", {
    from: deployer,
    args: [], // No constructor arguments
    log: true,
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const escrowGameMapping: Contract = await hre.ethers.getContract<Contract>("EscrowGameMapping", deployer);
  console.log("🥷🏻 Deployed", await escrowGameMapping.getAddress());
};

export default deployEscrowGameMapping;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags EscrowGameMapping
deployEscrowGameMapping.tags = ["EscrowGameMapping"];
