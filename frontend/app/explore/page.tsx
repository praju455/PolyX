"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, Profile, Post } from "../../lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { PostCard } from "../../components/PostCard";

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "hashtags" | "posts">("users");
  const query = searchParams.get("q") || "";
  const tag = searchParams.get("tag") || "";

  useEffect(() => {
    setMounted(true);
    if (query) setSearchInput(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim().length >= 2) {
      router.push(`/explore?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const { data: trending } = useQuery({
    queryKey: ["trendingHashtags"],
    queryFn: api.trendingHashtags,
  });

  const { data: tagPosts, isLoading: isLoadingTag } = useQuery<Post[]>({
    queryKey: ["feed", "tag", tag],
    queryFn: () => api.feed(tag),
    enabled: !!tag && mounted,
  });

  if (!mounted) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card-3d p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-12 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Explore</h1>
        <p className="text-gray-400 mb-6">Discover users, hashtags, and posts</p>

        <div className="flex gap-2 mb-4">
          {(["users", "hashtags", "posts"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                activeTab === t
                  ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/50"
                  : "hover:bg-white/5 text-white/70"
              }`}
            >
              {t === "users" ? "Users" : t === "hashtags" ? "Trending" : "Posts"}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              className="w-full bg-slate-800/50 border border-indigo-500/30 rounded-2xl p-4 pl-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg text-white placeholder-gray-500 transition-all"
              placeholder="Search by username, address, or post content..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">🔍</span>
          </div>
          <button type="submit" className="btn-3d w-full">
            Search
          </button>
        </form>
      </motion.div>

      {activeTab === "hashtags" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-3d p-6">
          <h2 className="text-xl font-bold mb-4">Trending Hashtags</h2>
          {trending && trending.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {trending.map((t) => (
                <Link
                  key={t.tag}
                  href={`/explore?tag=${encodeURIComponent(t.tag)}`}
                  className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 transition-all"
                >
                  #{t.tag} <span className="text-white/60 text-sm">({t.count})</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-white/60">No trending hashtags yet. Be the first to use #hashtags!</p>
          )}
        </motion.div>
      )}

      {tag && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Posts with #{tag}</h2>
          {isLoadingTag ? (
            <div className="card p-6 animate-pulse space-y-3">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
            </div>
          ) : tagPosts && tagPosts.length > 0 ? (
            <div className="space-y-4">
              {tagPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="card-3d p-10 text-center">
              <p className="opacity-70">No posts with #{tag} yet</p>
            </div>
          )}
        </div>
      )}

      {query && !tag && <SearchResults query={query} activeTab={activeTab} />}
    </div>
  );
}

function SearchResults({ query, activeTab }: { query: string; activeTab: string }) {
  const { data: userResults, isLoading: isLoadingUsers } = useQuery<Profile[]>({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: query.length >= 2 && activeTab === "users",
    retry: false,
  });

  const { data: postResults, isLoading: isLoadingPosts } = useQuery<Post[]>({
    queryKey: ["searchPosts", query],
    queryFn: () => api.searchPosts(query),
    enabled: query.length >= 2 && activeTab === "posts",
  });

  const isLoading = activeTab === "users" ? isLoadingUsers : isLoadingPosts;
  const hasUsers = userResults && userResults.length > 0;
  const hasPosts = postResults && postResults.length > 0;

  if (isLoading) {
    return (
      <div className="card-3d p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (activeTab === "users" && (!hasUsers || !userResults || userResults.length === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-3d p-12 text-center space-y-4"
      >
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-white">No users found</h3>
        <p className="text-gray-400">Try searching with a different term</p>
      </motion.div>
    );
  }

  if (activeTab === "posts" && (!hasPosts || postResults!.length === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-3d p-12 text-center space-y-4"
      >
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold text-white">No posts found</h3>
        <p className="text-gray-400">Try searching with different keywords</p>
      </motion.div>
    );
  }

  if (activeTab === "users" && userResults) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userResults.map((profile, idx) => (
            <UserCard key={profile.owner} profile={profile} index={idx} />
          ))}
        </div>
      </div>
    );
  }

  if (activeTab === "posts" && postResults) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Posts</h2>
        <div className="space-y-4">
          {postResults.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function UserCard({ profile, index }: { profile: Profile; index: number }) {
  const avatarUrl = profile.avatarCid
    ? `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${profile.avatarCid}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="card-3d p-6 hover:scale-105 transition-transform cursor-pointer group"
    >
      <Link href={`/profile?user=${profile.owner}`} className="flex items-center gap-4">
        {avatarUrl ? (
          <div className="relative">
            <img 
              src={avatarUrl} 
              alt={profile.displayName} 
              className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/50 group-hover:border-indigo-400 transition-all shadow-lg" 
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg group-hover:scale-110 transition-transform">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors truncate">
            {profile.displayName}
          </h3>
          <p className="text-indigo-400 text-sm">@{profile.handle}</p>
          {profile.bio && (
            <p className="text-gray-400 text-sm mt-2 line-clamp-2">{profile.bio}</p>
          )}
        </div>
        <div className="text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all text-xl">
          →
        </div>
      </Link>
    </motion.div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto">
        <div className="card-3d p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-12 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
