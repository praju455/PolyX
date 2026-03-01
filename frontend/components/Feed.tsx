import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { api, Post } from "../lib/api";
import { PostCard } from "./PostCard";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

interface FeedProps {
  mode?: "all" | "following";
  blocked?: string[];
}

export function Feed({ mode = "all", blocked = [] }: FeedProps) {
  const { address, isConnected } = useAccount();

  const { data: allPosts, isLoading: isLoadingAll } = useQuery<Post[]>({
    queryKey: ["feed"],
    queryFn: api.feed,
    refetchInterval: 15_000,
  });

  const { data: following, isLoading: isLoadingFollowing } = useQuery<string[]>({
    queryKey: ["following", address],
    queryFn: () => (address ? api.following(address) : Promise.resolve([])),
    enabled: mode === "following" && !!address && isConnected,
    refetchInterval: 15_000,
  });

  const isLoading = isLoadingAll || (mode === "following" && isLoadingFollowing);

  // Show connect wallet message for following feed when not connected
  if (mode === "following" && !isConnected) {
    return (
      <div className="card p-10 text-center space-y-4">
        <div className="text-5xl mb-4">🔗</div>
        <p className="text-2xl font-bold">Connect Your Wallet</p>
        <p className="opacity-70 text-lg">
          Connect your wallet to see posts from users you follow.
        </p>
        <div className="flex justify-center pt-4">
          <ConnectButton showBalance={false} />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 space-y-3 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/4" />
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-4 bg-white/10 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!allPosts || allPosts.length === 0) {
    return (
      <div className="card p-10 text-center">
        <div className="text-5xl mb-4">📝</div>
        <p className="opacity-70 text-lg font-semibold">No posts yet. Be the first to post!</p>
      </div>
    );
  }

  // Filter blocked users and comments (comments show as replies, not in main feed)
  let filteredPosts = allPosts.filter(
    (post) => !blocked.includes(post.author.toLowerCase()) && post.postType !== 3
  );

  // Filter by following if mode is "following"
  if (mode === "following" && following && following.length > 0) {
    const followingLower = following.map((addr) => addr.toLowerCase());
    filteredPosts = filteredPosts.filter((post) => followingLower.includes(post.author.toLowerCase()));
  } else if (mode === "following" && (!following || following.length === 0) && isConnected) {
    return (
      <div className="card p-10 text-center space-y-4">
        <div className="text-5xl mb-4">👥</div>
        <p className="opacity-70 text-lg font-semibold">You're not following anyone yet.</p>
        <p className="opacity-60 text-sm">Follow users to see their posts here!</p>
        <Link href="/search" className="btn-primary inline-block mt-4">
          Search Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredPosts.length > 0 ? (
        filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
      ) : (
        <div className="card p-10 text-center">
          <p className="opacity-70 text-lg">No posts to display.</p>
        </div>
      )}
    </div>
  );
}
