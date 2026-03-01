"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { api, Post } from "../../lib/api";
import { PostCard } from "../../components/PostCard";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function BookmarksPage() {
  const { address, isConnected } = useAccount();

  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["bookmarks", address],
    queryFn: () => (address ? api.bookmarks(address) : Promise.resolve([])),
    enabled: !!address && isConnected,
  });

  if (!isConnected || !address) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="card-3d p-10 text-center space-y-4">
          <div className="text-5xl mb-4">🔖</div>
          <p className="text-2xl font-bold">Bookmarks</p>
          <p className="opacity-70">Connect your wallet to view your saved posts.</p>
          <div className="flex justify-center pt-4">
            <ConnectButton showBalance={false} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="card-3d p-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">Bookmarks</h1>
        <p className="text-white/70">Posts you&apos;ve saved for later</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 space-y-3 animate-pulse">
              <div className="h-4 bg-white/10 rounded w-1/4" />
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="card-3d p-10 text-center">
          <div className="text-5xl mb-4">📑</div>
          <p className="text-xl font-semibold opacity-80">No bookmarks yet</p>
          <p className="opacity-60 mt-2">Save posts by clicking the bookmark icon on any post.</p>
          <Link href="/" className="btn-primary inline-block mt-6">
            Explore Feed
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
