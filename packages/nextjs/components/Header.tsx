"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, TrophyIcon, RocketLaunchIcon, UserIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

const menuLinks: HeaderMenuLink[] = [
  { label: "Ninja Strike", href: "/game", icon: <RocketLaunchIcon className="h-4 w-4" /> },
  { label: "Leaderboard", href: "/leaderboard", icon: <TrophyIcon className="h-4 w-4" /> },
  { label: "NFT Arena", href: "/nft-arena", icon: <UserIcon className="h-4 w-4" /> },
];

const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => (
        <li key={href}>
          <Link
            href={href}
            className={`${pathname === href ? "bg-secondary shadow-md" : ""
              } hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
          >
            {icon}
            <span>{label}</span>
          </Link>
        </li>
      ))}
    </>
  );
};

export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(burgerMenuRef, useCallback(() => setIsDrawerOpen(false), []));

  return (
    <div className="bg-sky-900 sticky lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-4 sm:px-8">
      <div className="navbar-start w-auto h-16 p-10"> {/* Increased width and height */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image alt="Ninja Strike" className="cursor-pointer" width={200} height={64} src="/logo.svg" /> {/* Increased width and height */}
        </Link>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end flex-grow justify-end">
        <div className="lg:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
            onClick={() => setIsDrawerOpen(prev => !prev)}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52 right-0"
              onClick={() => setIsDrawerOpen(false)}
            >
              <HeaderMenuLinks />
            </ul>
          )}
        </div>
        <RainbowKitCustomConnectButton />
        <FaucetButton />
      </div>
    </div>
  );
};