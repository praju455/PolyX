"use client";

import { useAccount } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useState, useEffect } from "react";

export function FollowButton({ currentUser, targetUser }: { currentUser: string; targetUser: string }) {
  const queryClient = useQueryClient();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!currentUser || !targetUser) {
      setIsChecking(false);
      return;
    }
    const checkFollowing = async () => {
      try {
        const following = await api.following(currentUser);
        const isCurrentlyFollowing = following.map((f) => f.toLowerCase()).includes(targetUser.toLowerCase());
        setIsFollowing(isCurrentlyFollowing);
      } catch (err) {
        console.error("Error checking follow status:", err);
        setIsFollowing(false);
      } finally {
        setIsChecking(false);
      }
    };
    checkFollowing();
  }, [currentUser, targetUser]);

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        return api.unfollow(currentUser, targetUser);
      } else {
        return api.follow(currentUser, targetUser);
      }
    },
    onSuccess: async () => {
      // Toggle the state immediately for responsive UI
      setIsFollowing(!isFollowing);
      
      // Invalidate and refetch all related queries immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["following", currentUser] }),
        queryClient.invalidateQueries({ queryKey: ["followers", targetUser] }),
        queryClient.invalidateQueries({ queryKey: ["profile", targetUser] }),
        queryClient.invalidateQueries({ queryKey: ["feed"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications", targetUser] }),
      ]);
      
      // Force immediate refetch to get accurate data
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ["following", currentUser] }),
        queryClient.refetchQueries({ queryKey: ["followers", targetUser] }),
      ]);
      
      // Re-check following status after refetch
      try {
        const followingList = await api.following(currentUser);
        const actualState = followingList.map((f) => f.toLowerCase()).includes(targetUser.toLowerCase());
        setIsFollowing(actualState);
      } catch (err) {
        console.error("Error re-checking follow status:", err);
      }
    },
  });

  if (isChecking) {
    return (
      <button className="btn-secondary text-sm" disabled>
        ...
      </button>
    );
  }

  return (
    <button
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 ${
        isFollowing
          ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30"
          : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
      }`}
      disabled={followMutation.isPending}
      onClick={() => followMutation.mutate()}
    >
      {followMutation.isPending ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>...</span>
        </>
      ) : isFollowing ? (
        <>
          <span>✓</span>
          <span>Following</span>
        </>
      ) : (
        <>
          <span>+</span>
          <span>Follow</span>
        </>
      )}
    </button>
  );
}


