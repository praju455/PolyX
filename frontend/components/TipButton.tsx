"use client";

import { useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseEther } from "viem";

const POLYX_ABI = [
  {
    inputs: [{ name: "postId", type: "uint256" }],
    name: "tip",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

export function TipButton({ postId }: { postId: number }) {
  const { address } = useAccount();
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("0.001");
  const contractAddress = process.env.NEXT_PUBLIC_POLYX_CONTRACT_ADDRESS as `0x${string}` | undefined;

  const { writeContract, isPending, error } = useWriteContract();

  const handleTip = () => {
    if (!contractAddress || !address) return;
    const value = parseEther(amount);
    if (value <= 0n) return;
    writeContract(
      {
        address: contractAddress,
        abi: POLYX_ABI,
        functionName: "tip",
        args: [BigInt(postId)],
        value,
      },
      {
        onSuccess: () => {
          setShowModal(false);
          setAmount("0.001");
        },
      }
    );
  };

  if (!contractAddress) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={!address}
        className="flex items-center gap-2 hover:text-amber-400 transition-all group"
        title="Tip author"
        aria-label="Send tip to author"
      >
        <span className="text-xl">💰</span>
      </button>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="card-3d p-6 max-w-sm w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Tip Author</h3>
            <p className="text-white/70 text-sm mb-4">Send MATIC to the post author (you pay gas)</p>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.001"
              className="w-full bg-slate-800/50 border border-indigo-500/30 rounded-xl p-3 mb-4 text-white"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-xl border border-white/20 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleTip}
                disabled={isPending || !amount || parseFloat(amount) <= 0}
                className="flex-1 py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/50 transition-all disabled:opacity-50"
              >
                {isPending ? "Sending..." : "Send Tip"}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error.message}</p>}
          </div>
        </div>
      )}
    </>
  );
}
