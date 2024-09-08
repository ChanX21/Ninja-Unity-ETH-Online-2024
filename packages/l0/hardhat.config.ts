// Get the environment configuration from .env file
//
// To make use of automatic environment setup:
// - Duplicate .env.example file and name it .env
// - Fill in the environment variables
import 'dotenv/config'

import 'hardhat-deploy'
import 'hardhat-contract-sizer'
import '@nomiclabs/hardhat-ethers'
import '@layerzerolabs/toolbox-hardhat'
import { HardhatUserConfig, HttpNetworkAccountsUserConfig } from 'hardhat/types'

import { EndpointId } from '@layerzerolabs/lz-definitions'

// Set your preferred authentication method
//
// If you prefer using a mnemonic, set a MNEMONIC environment variable
// to a valid mnemonic
const MNEMONIC = process.env.MNEMONIC
import { task } from "hardhat/config";

import fs from "fs";
import path from "path";
task("setLZ", "Set LayerZero (LZ) contract")
  .setAction(async (taskArgs: { }, {ethers, network, run}) => {

    const [deployer] = await ethers.getSigners();
    let eid;
    network.name=='base-testnet'?eid=40245:eid=40285;
    const { receipt } = JSON.parse(fs.readFileSync(path.resolve(`./deployments/${network.name}/Escrow.json`),'utf8'));
    const { receipt: receipt2 } = JSON.parse(fs.readFileSync(path.resolve(`./deployments/${network.name}/LZEscrow.json`),'utf8'));
    // Attach to the Escrow contract using its ABI and address
   const Escrow = await ethers.getContractFactory("Escrow");
   const LZEscrow = await ethers.getContractFactory("LZEscrow");

const escrowContract: Contract = Escrow.attach(receipt.contractAddress);
const lzEscrowContract: Contract = LZEscrow.attach(receipt.contractAddress);
    const tx = await escrowContract.connect(deployer).setLZ(receipt2.contractAddress, eid);
    await tx.wait();
    const tx2 = await lzEscrowContract.connect(deployer).setEscrow(receipt.contractAddress);
    await tx2.wait();
    const { receipt: receipt3 } = JSON.parse(fs.readFileSync(path.resolve(`./deployments/${network.name}/NFT.json`),'utf8'));
    const { receipt: receipt4 } = JSON.parse(fs.readFileSync(path.resolve(`./deployments/${network.name}/LZ.json`),'utf8'));
    console.log(network,receipt)
    const NFT = await ethers.getContractFactory("NFT");
   const LZ = await ethers.getContractFactory("LZ");

const NFTContract: Contract = NFT.attach(receipt3.contractAddress);
const lzContract: Contract = LZ.attach(receipt4.contractAddress);
    const tx3 = await NFTContract.connect(deployer).setLZ(receipt4.contractAddress, eid);
    await tx3.wait();
    const tx4 = await lzContract.connect(deployer).setNFT(receipt3.contractAddress);
    await tx4.wait();
  });

// If you prefer to be authenticated using a private key, set a PRIVATE_KEY environment variable
const PRIVATE_KEY = process.env.PRIVATE_KEY

const accounts: HttpNetworkAccountsUserConfig | undefined = MNEMONIC
    ? { mnemonic: MNEMONIC }
    : PRIVATE_KEY
      ? [PRIVATE_KEY]
      : undefined

if (accounts == null) {
    console.warn(
        'Could not find MNEMONIC or PRIVATE_KEY environment variables. It will not be possible to execute transactions in your example.'
    )
}

const config: HardhatUserConfig = {
    paths: {
        cache: 'cache/hardhat',
    },
    solidity: {
        compilers: [
            {
                version: '0.8.22',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
      
       'hedera-testnet': {
            eid: EndpointId.HEDERA_V2_TESTNET,
            url: process.env.RPC_URL_FUJI || 'https://testnet.hashio.io/api',
            accounts,
        },
        'base-testnet': {
            eid: EndpointId.BASESEP_V2_TESTNET,
            url: process.env.RPC_URL_FUJI || 'https://sepolia.base.org/',
            accounts,

        },
    },
    namedAccounts: {
        deployer: {
            default: 0, // wallet address of index[0], of the mnemonic in .env
        },
    },
}

export default config
