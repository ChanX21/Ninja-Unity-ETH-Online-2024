"use client";

import Image from "next/image";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10 relative min-h-screen w-full overflow-x-hidden ">
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <Image src="/Ninjabg.png" alt="Ninja Strike Background" layout="fill" objectFit="cover" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 items-center w-full px-4 sm:px-8 max-w-screen-xl">
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <div className="flex-grow flex justify-end">
            <RainbowKitCustomConnectButton />
            <FaucetButton />
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
