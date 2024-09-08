import React, { useState, useEffect } from "react";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { CurrencyDollarIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { HeartIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { BuidlGuidlLogo } from "~~/components/assets/BuidlGuidlLogo";
import { Faucet } from "~~/components/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";
import XMTPChatGPTBot from "~~/components/XMTPChatGPTBot";
import { useAccount } from "wagmi";

export const Footer = () => {
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatInitialized, setIsChatInitialized] = useState(false);
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected && !isChatInitialized) {
      setIsChatInitialized(true);
      setIsChatOpen(true);
    }
  }, [isConnected, isChatInitialized]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div>
        <div className="fixed flex justify-between items-center w-full z-10 p-4 bottom-0 left-0 pointer-events-none">
          <div className="flex space-x-2 pointer-events-auto">
            {nativeCurrencyPrice > 0 && (
              <div className="btn btn-primary btn-sm font-normal cursor-auto gap-0">
                <CurrencyDollarIcon className="h-4 w-4 mr-0.5" />
                <span>{nativeCurrencyPrice.toFixed(2)}</span>
              </div>
            )}
            {isLocalNetwork && (
              <>
                <Faucet />
                <Link href="/blockexplorer" passHref className="btn btn-primary btn-sm font-normal gap-1">
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  <span>Block Explorer</span>
                </Link>
              </>
            )}
          </div>
          {/* <SwitchTheme className="pointer-events-auto" /> */}
        </div>
      </div>
      <div className="w-full">
        <ul className="menu menu-horizontal w-full">
          <div className="flex justify-center items-center gap-2 text-sm w-full">
            <div className="text-center">
              <a
                href="https://github.com/scaffold-eth/se-2"
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                Fork me
              </a>
            </div>
            <span>·</span>
            <div className="flex justify-center items-center gap-2">
              <p className="m-0 text-center">
                Built with <HeartIcon className="inline-block h-4 w-4" /> at
              </p>
              <a
                href="https://buidlguidl.com/"
                target="_blank"
                rel="noreferrer"
                className="flex justify-center items-center gap-1"
              >
                <BuidlGuidlLogo className="w-3 h-5 pb-1" />
                <span className="link">BuidlGuidl</span>
              </a>
            </div>
            <span>·</span>
            <div className="text-center">
              <a
                href="https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA"
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                Support
              </a>
            </div>
          </div>
        </ul>
      </div>
      <div className="fixed bottom-4 right-4 pointer-events-auto">
        <button
          className={`btn ${isChatOpen ? 'btn-primary' : 'btn-secondary'} btn-sm font-normal gap-1`}
          onClick={toggleChat}
        >
          <ChatBubbleLeftRightIcon className="h-4 w-4" />
          <span>{isChatOpen ? 'Close Chat' : 'Open Chat'}</span>
        </button>
      </div>
      {isChatInitialized && (
        <div className={`fixed bottom-16 right-4 w-80 h-96 bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${isChatOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
          <XMTPChatGPTBot onClose={() => setIsChatOpen(false)} isOpen={isChatOpen} />
        </div>
      )}
    </div>
  );
};
