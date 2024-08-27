"use client";

import React, { useState } from "react";
import lighthouse from "@lighthouse-web3/sdk";
import { decodeEventLog } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { getAllContracts } from "~~/utils/scaffold-eth/contractsData";

const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE ?? ""; // Provide a default value for apiKey if it is undefined

const NFTPage: React.FC = () => {
  const [imageName, setImageName] = useState<string>("");
  const [ipfsCid, setIpfsCid] = useState<string>("");
  const [tokenID, setTokenID] = useState<bigint>(BigInt(0));
  const [address, setAddress] = useState<string>("");
  const publicClient = usePublicClient();
  const { NFT } = getAllContracts();
  const { writeContractAsync: writeTokenURI } = useScaffoldWriteContract("NFT");
  const { address: addressWagmi } = useAccount();

  const handleMint = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    try {
      const txHash = await scMintNFT(ipfsCid);
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: txHash as `0x${string}` });

      // Log the entire receipt for debugging purposes
      console.log("Transaction Receipt:", receipt);

      if (!receipt || !receipt.logs || receipt.logs.length < 2) {
        throw new Error("Expected log entry is missing in the transaction receipt.");
      }

      // Log each log entry for debugging purposes
      receipt.logs.forEach((log, index) => {
        console.log(`Log ${index}:`, log);
      });

      const topics = decodeEventLog({
        abi: NFT.abi,
        data: receipt.logs[1].data,
        topics: receipt.logs[1].topics ?? [],
      });

      if (topics.args) {
        setTokenID(topics.args[0]?._tokenId);
      }

      console.log("id", tokenID);
    } catch (error) {
      console.error("Error in handleMint:", error);
    }
  };

  const scMintNFT = async (ipfsCid: string) => {
    const metadata = {
      description: "Profile NFT",
      external_url: "url to their profile page",
      image: `https://gateway.lighthouse.storage/ipfs/${ipfsCid}`,
      name: imageName,
      attributes: [
        { trait_type: "rock", value: "throwing starfish", weight: "20" },
        { trait_type: "paper", value: "magic spell", weight: "5" },
        { trait_type: "ninja", value: "katana", weight: "75" },
        { trait_type: "points", value: "2024" },
      ],
    };
    const addressToMint = address || addressWagmi;
    const txHash = await writeTokenURI({
      functionName: "mint",
      args: [addressToMint, JSON.stringify(metadata)],
    });
    return txHash;
  };

  const uploadFile = async (file: FileList) => {
    console.log("Uploading file:", file);
    try {
      const output = await lighthouse.upload(file, apiKey, undefined, undefined);
      console.log("File Status:", output);
      console.log("Visit at https://gateway.lighthouse.storage/ipfs/" + output.data.Hash);
      const jsonIpfsCid = output.data.Hash;
      setIpfsCid(jsonIpfsCid);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      await uploadFile(files);
    }
  };

  return (
    <main>
      <div className="flex min-h-screen flex-col items-center p-12">
        <div className="z-10 max-w-full w-full flex flex-col items-center justify-center font-mono text-sm space-y-4">
          <h1 className="text-4xl mb-4">Profile NFT Mint</h1>
          <div className="w-full flex flex-col items-center">
            <input
              className="w-full p-2 mb-2"
              value={imageName}
              onChange={e => setImageName(e.target.value)}
              placeholder="Enter image name"
            />
            <input
              className="w-full p-2 mb-2"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Enter recipient's address"
            />
            <input type="file" onChange={handleFileChange} className="w-full p-2 mb-2" />
            <button
              onClick={handleMint}
              className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              type="button"
            >
              Mint NFT
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NFTPage;