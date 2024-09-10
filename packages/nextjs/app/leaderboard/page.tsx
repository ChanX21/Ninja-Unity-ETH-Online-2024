"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

interface RawLeaderboardEntry {
  winner: string;
  amount: string;
}

interface ProcessedLeaderboardEntry {
  winner: string;
  amount: string;
}

const Leaderboard: React.FC = () => {
  const { address: connectedAddress } = useAccount();
  const [leaderboardData, setLeaderboardData] = useState<ProcessedLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const processLeaderboard = (leaderboard: RawLeaderboardEntry[]): ProcessedLeaderboardEntry[] => {
    const summedLeaderboard: { [key: string]: bigint } = {};

    leaderboard.forEach(entry => {
      const { winner, amount } = entry;
      const amountBigInt = BigInt(amount);

      if (summedLeaderboard[winner]) {
        summedLeaderboard[winner] += amountBigInt;
      } else {
        summedLeaderboard[winner] = amountBigInt;
      }
    });

    const processedLeaderboard = Object.entries(summedLeaderboard).map(([winner, amount]) => ({
      winner,
      amount: amount.toString(),
    }));

    // Convert BigInt comparison to number comparison
    return processedLeaderboard.sort((a, b) => Number(BigInt(b.amount) - BigInt(a.amount)));
  };

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
                leaderboard: Escrow_Released(limit: 20) {
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
        const processedData = processLeaderboard(result.data.leaderboard);
        setLeaderboardData(processedData);
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
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-b from-purple-900 via-indigo-900 to-black">
      <Image
        src="/Leaderboardbg.png"
        alt="Ninja Strike Background"
        layout="fill"
        objectFit="cover"
        className="opacity-30"
      />

      <div className="relative z-10 h-full overflow-y-auto pb-24"> {/* Added pb-24 for footer space */}
        <div className="flex flex-col items-center pt-4 px-2 sm:px-4 pb-8">
          <Image src="/nslogo.png" alt="Ninja Strike Logo" width={200} height={200} className="mb-4" />

          <div className="bg-black bg-opacity-50 rounded-lg p-2 mb-4 border border-purple-500 shadow-lg shadow-purple-500/50 w-full max-w-md">
            <p className="text-white font-medium mb-1 text-center text-sm">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>

          <div className="w-full max-w-xl bg-black bg-opacity-70 rounded-lg overflow-hidden shadow-2xl border border-indigo-500 mb-24"> {/* Added mb-24 for additional space */}
            <h2 className="text-xl sm:text-2xl font-bold text-center text-white py-3 bg-gradient-to-r from-purple-600 to-indigo-600 shadow-md">
              Ninja Strike Leaderboard
            </h2>

            {loading ? (
              <p className="text-white text-center py-4">Loading leaderboard data...</p>
            ) : error ? (
              <p className="text-red-500 text-center py-4">{error}</p>
            ) : (
              <div className="overflow-x-auto max-h-[calc(100vh-400px)]"> {/* Set a max height and allow scrolling */}
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-indigo-800"> {/* Make the header sticky */}
                    <tr className="text-white">
                      <th className="p-2 font-semibold text-xs sm:text-sm">Rank</th>
                      <th className="p-2 font-semibold text-xs sm:text-sm">Player</th>
                      <th className="p-2 font-semibold text-xs sm:text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((entry, index) => (
                      <tr
                        key={index}
                        className={`${index % 2 === 0 ? "bg-indigo-900 bg-opacity-50" : "bg-purple-900 bg-opacity-50"
                          } hover:bg-opacity-75 transition-colors`}
                      >
                        <td className="p-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full text-black font-bold text-xs">
                            {index + 1}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-2">
                            <div className="relative w-6 h-6 overflow-hidden rounded-full border border-purple-400">
                              <Image
                                src="/avatar.jpg"
                                alt={`${entry.winner}'s avatar`}
                                layout="fill"
                                objectFit="cover"
                              />
                            </div>
                            <span className="text-white font-medium text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[200px]">
                              {entry.winner}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="text-green-400 font-bold text-xs sm:text-sm">{entry.amount}</span>
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
    </div>
  );
};

export default Leaderboard;