"use client";

import { useQuery } from "@tanstack/react-query";
import { api, Profile } from "../lib/api";
import { useState } from "react";
import Link from "next/link";

export function ProfileStats({ 
  userAddress, 
  currentUser, 
  followingList 
}: { 
  userAddress: string; 
  currentUser?: string;
  followingList?: string[];
}) {
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const { data: followers, error: followersError, refetch: refetchFollowers } = useQuery<string[]>({
    queryKey: ["followers", userAddress],
    queryFn: () => api.followers(userAddress),
    enabled: Boolean(userAddress),
    retry: false,
    refetchInterval: 5_000, // Refetch every 5 seconds to keep counts updated
    staleTime: 0, // Always consider data stale to ensure fresh data
  });

  const { data: following, error: followingError, refetch: refetchFollowing } = useQuery<string[]>({
    queryKey: ["following", userAddress],
    queryFn: () => api.following(userAddress),
    enabled: Boolean(userAddress),
    retry: false,
    refetchInterval: 5_000, // Refetch every 5 seconds to keep counts updated
    staleTime: 0, // Always consider data stale to ensure fresh data
  });

  // Calculate mutual followers
  const mutualFollowers = currentUser && following && followingList
    ? following.filter(f => followingList.includes(f.toLowerCase()))
    : [];

  const followersCount = followers?.length || 0;
  const followingCount = following?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-6">
        <button
          onClick={() => setShowFollowers(!showFollowers)}
          className="hover:text-indigo-400 transition-colors"
        >
          <span className="font-bold text-lg">{followersCount}</span>
          <span className="opacity-70 ml-1">Followers</span>
        </button>
        <button
          onClick={() => setShowFollowing(!showFollowing)}
          className="hover:text-indigo-400 transition-colors"
        >
          <span className="font-bold text-lg">{followingCount}</span>
          <span className="opacity-70 ml-1">Following</span>
        </button>
      </div>

      {/* Mutual Followers (when viewing other users) */}
      {currentUser && currentUser.toLowerCase() !== userAddress.toLowerCase() && mutualFollowers.length > 0 && (
        <div className="card p-4 space-y-2">
          <p className="text-sm font-semibold opacity-70">
            {mutualFollowers.length} mutual follower{mutualFollowers.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {mutualFollowers.slice(0, 2).map((addr) => (
              <MutualFollowerItem key={addr} address={addr} />
            ))}
            {mutualFollowers.length > 2 && (
              <span className="text-xs opacity-60">+{mutualFollowers.length - 2} more</span>
            )}
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowers && (
        <FollowersModal
          followers={(followers && Array.isArray(followers)) ? followers : []}
          error={followersError as Error | null}
          onClose={() => setShowFollowers(false)}
        />
      )}

      {/* Following Modal */}
      {showFollowing && (
        <FollowingModal
          following={(following && Array.isArray(following)) ? following : []}
          error={followingError as Error | null}
          onClose={() => setShowFollowing(false)}
        />
      )}
    </div>
  );
}

function MutualFollowerItem({ address }: { address: string }) {
  const { data: profile } = useQuery<Profile>({
    queryKey: ["profile", address],
    queryFn: () => api.profileByOwner(address),
    enabled: Boolean(address),
    retry: false,
  });

  const displayName = profile?.displayName || profile?.handle || `${address.slice(0, 6)}...${address.slice(-4)}`;
  const avatarUrl = profile?.avatarCid
    ? `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${profile.avatarCid}`
    : null;

  return (
    <Link
      href={`/profile?user=${address}`}
      className="flex items-center gap-2 hover:bg-white/5 p-2 rounded-lg transition-colors"
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm font-medium">{displayName}</span>
    </Link>
  );
}

function FollowersModal({ followers, error, onClose }: { followers: string[]; error?: Error | null; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Followers</h2>
          <button onClick={onClose} className="text-2xl opacity-70 hover:opacity-100">×</button>
        </div>
        <div className="space-y-2">
          {error ? (
            <p className="opacity-70 text-center py-4 text-red-400">Error loading followers: {error.message}</p>
          ) : followers.length === 0 ? (
            <p className="opacity-70 text-center py-4">No followers yet</p>
          ) : (
            followers.map((addr) => (
              <FollowerItem key={addr} address={addr} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FollowingModal({ following, error, onClose }: { following: string[]; error?: Error | null; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="card p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Following</h2>
          <button onClick={onClose} className="text-2xl opacity-70 hover:opacity-100">×</button>
        </div>
        <div className="space-y-2">
          {error ? (
            <p className="opacity-70 text-center py-4 text-red-400">Error loading following: {error.message}</p>
          ) : !following || following.length === 0 ? (
            <p className="opacity-70 text-center py-4">Not following anyone yet</p>
          ) : (
            following.map((addr) => (
              <FollowerItem key={addr} address={addr} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function FollowerItem({ address }: { address: string }) {
  const { data: profile } = useQuery<Profile>({
    queryKey: ["profile", address],
    queryFn: () => api.profileByOwner(address),
    enabled: Boolean(address),
    retry: false,
  });

  const displayName = profile?.displayName || profile?.handle || `${address.slice(0, 6)}...${address.slice(-4)}`;
  const avatarUrl = profile?.avatarCid
    ? `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${profile.avatarCid}`
    : null;

  return (
    <Link
      href={`/profile?user=${address}`}
      className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors"
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/50" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <p className="font-semibold">{displayName}</p>
        {profile?.handle && <p className="text-sm opacity-60">@{profile.handle}</p>}
      </div>
    </Link>
  );
}


