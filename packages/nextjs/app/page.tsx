"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { useAccount, useChainId } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldReadContract } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const [showPopup, setShowPopup] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Get the target networks information
  const targetNetworks = getTargetNetworks();

  // Get the deployed contract information
  const { data: deployedContractData } = useDeployedContractInfo("YourContractName");

  console.log(chainId, targetNetworks, deployedContractData);

  // Use scaffoldContractRead to check for NFT ownership
  const { data: hasNFT } = useScaffoldReadContract({
    contractName: "YourContractName",
    functionName: "checkNFTOwnership", // Replace with your actual function name
    args: [connectedAddress],
  });

  useEffect(() => {
    if (isConnected && hasNFT !== undefined) {
      setShowPopup(!hasNFT);
    }
  }, [isConnected, hasNFT]);

  const closePopup = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowPopup(false);
      setIsClosing(false);
    }, 1500);
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden">
      {/* Main background */}
      <div className="absolute inset-0">
        <Image
          src="/Ninjabg.png"
          alt="Ninja Strike Background"
          layout="fill"
          objectFit="cover"
          className={showPopup ? "opacity-50" : "opacity-100 transition-opacity duration-1000"}
        />
      </div>

      {/* Connect Button - Positioned at top right */}
      <div className="absolute top-4 right-4 z-20">
        <div className="transform scale-110">
          <RainbowKitCustomConnectButton />
        </div>
      </div>

      {/* Popup overlay */}
      {showPopup && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className={`relative w-[90%] max-w-[600px] aspect-[3/3] bg-transparent rounded-lg shadow-2xl ${
              isClosing ? "animate-ninja-vanish" : "animate-fadein"
            }`}
          >
            <button
              onClick={closePopup}
              className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full text-xl font-bold hover:bg-red-700 transition-colors z-10 flex items-center justify-center"
            >
              〤
            </button>
            <Image src="/Ninjapopup.png" alt="Ninja Popup" layout="fill" objectFit="contain" className="rounded-3xl" />
            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
              <button className="px-6 py-2 bg-blue-600 text-white rounded-full text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg">
                MINT NFT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 items-center w-full px-4 sm:px-8 max-w-screen-xl z-10">
        <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
          {isConnected && (
            <>
              <p className="my-2 font-medium text-white">Connected Address:</p>
              <Address address={connectedAddress} />
            </>
          )}
        </div>
        <div className="flex-grow flex justify-end items-center space-x-4">{isConnected && <FaucetButton />}</div>
      </div>
    </div>
  );
};

export default Home;
