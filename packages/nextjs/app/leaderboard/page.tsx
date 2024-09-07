"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

interface LeaderboardEntry {
  winner: string;
  amount: string;
}

const Leaderboard = () => {
  const { address: connectedAddress } = useAccount();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch("https://indexer.bigdevenergy.link/7fa3490/v1/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              query {
                leaderboard: Escrow_Released(limit: 5) {
                  winner
                  amount
                }
              }
            `,
          }),
        });

        const result = await response.json();
        if (result.errors) {
          throw new Error(result.errors[0].message);
        }
        setLeaderboardData(result.data.leaderboard);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching leaderboard data:", err);
        setError("Failed to load leaderboard data. Please try again later.");
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-purple-900 via-indigo-900 to-black">
      {/* Background Image */}
      <Image
        src="/Leaderboardbg.png"
        alt="Ninja Strike Background"
        layout="fill"
        objectFit="cover"
        className="opacity-30"
      />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center pt-10 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Image src="/nslogo.png" alt="Ninja Strike Logo" width={600} height={600} className="mb-8" />

        {/* Connected Address */}
        <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-8 border border-purple-500 shadow-lg shadow-purple-500/50">
          <p className="text-white font-medium mb-2">Connected Address:</p>
          <Address address={connectedAddress} />
        </div>

        {/* Leaderboard */}
        <div className="w-full max-w-4xl bg-black bg-opacity-70 rounded-lg overflow-hidden shadow-2xl border border-indigo-500">
          <h2 className="text-3xl font-bold text-center text-white py-6 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md">
            Ninja Strike Leaderboard
          </h2>

          {loading ? (
            <p className="text-white text-center py-4">Loading leaderboard data...</p>
          ) : error ? (
            <p className="text-red-500 text-center py-4">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-indigo-800 text-white">
                    <th className="p-4 font-semibold">Rank</th>
                    <th className="p-4 font-semibold">Player</th>
                    <th className="p-4 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((entry, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? "bg-indigo-900 bg-opacity-50" : "bg-purple-900 bg-opacity-50"
                      } hover:bg-opacity-75 transition-colors`}
                    >
                      <td className="p-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full text-black font-bold">
                          {index + 1}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative w-10 h-10 overflow-hidden rounded-full border-2 border-purple-400">
                            <Image src="/avatar.jpg" alt={`${entry.winner}'s avatar`} layout="fill" objectFit="cover" />
                          </div>
                          <span className="text-white font-medium">{entry.winner}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-green-400 font-bold">{entry.amount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
