"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./NftArena.module.css";
import { useAccount } from "wagmi";

interface DepositData {
  amount: string;
  escrowType: string;
  escrowId: string;
}

interface WinData {
  amount: string;
  escrowId: string;
}

const NftArena: React.FC = () => {
  const { address, isConnected } = useAccount(); // isConnected will help check if wallet is connected
  const [totalDeposits, setTotalDeposits] = useState<number>(0);
  const [totalWins, setTotalWins] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const calculateTotal = (items: { amount: string }[]): number => {
    return items.reduce((acc: number, item: { amount: string }) => acc + parseInt(item.amount), 0);
  };

  useEffect(() => {
    const fetchData = async () => {
      // Ensure the wallet is connected and the address is valid
      if (!address || !isConnected) {
        setError("Wallet not connected.");
        setLoading(false);
        return;
      }

      console.log("Fetching data for address:", address); // Debug log to verify the address

      const query = `
        query UserStats($user: String!) {
          totalDeposits: Escrow_Deposited(where: {user: {_eq: $user}}) {
            id
            amount
            escrowType
            escrowId
          }
          totalWins: Escrow_Released(where: {winner: {_eq: $user}}) {
            id
            amount
            escrowId
          }
          transactionHistory: Escrow_Deposited(where: {user: {_eq: $user}}) {
            id
            amount
            escrowType
            escrowId
          }
          winningHistory: Escrow_Released(where: {winner: {_eq: $user}}) {
            id
            amount
            escrowId
          }
        }
      `;

      const variables = {
        user: address, // Dynamically passing the connected user address
      };

      const raw = JSON.stringify({
        query,
        variables,
      });

      const requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: raw,
      };

      try {
        const response = await fetch("https://indexer.bigdevenergy.link/7fa3490/v1/graphql", requestOptions);
        const result = await response.json();
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }

        const fetchedDeposits: DepositData[] = result.data.totalDeposits;
        const fetchedWins: WinData[] = result.data.totalWins;

        const calculatedDeposits = calculateTotal(fetchedDeposits);
        const totalWinsCount = fetchedWins.length;

        setTotalDeposits(calculatedDeposits);
        setTotalWins(totalWinsCount);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again later.");
        setLoading(false);
      }
    };

    if (address && isConnected) {
      fetchData();
    }
  }, [address, isConnected]); // Trigger fetchData when address or isConnected changes

  return (
    <div className={styles.container}>
      <Image src="/nslogo.png" alt="Ninja Strike" width={550} height={250} className={styles.logo} />

      <h6 className={styles.subtitle}>NINJA STATS</h6>

      {loading ? (
        <p className={styles.loading}>Loading data...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <h3 className={styles.label}>NINJA WINS</h3>
            <p className={styles.value}>{totalWins.toString().padStart(2, "0")}</p>
          </div>
          <div className={styles.statItem}>
            <h3 className={styles.label}>NINJA DEPOSITS</h3>
            <p className={styles.value}>{(totalDeposits / 1e18).toFixed(1)} ETH</p>
          </div>
        </div>
      )}

      <div className={styles.wallet}>
        <p className="my-2 font-medium text-white">Connected Address:</p>
        <p>CONNECTED : {isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not Connected"}</p>
      </div>
    </div>
  );
};

export default NftArena;
