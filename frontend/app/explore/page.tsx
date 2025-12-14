"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, Profile } from "../../lib/api";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const query = searchParams.get("q") || "";

  useEffect(() => {
    setMounted(true);
    if (query) {
      setSearchInput(query);
    }
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim().length >= 2) {
      router.push(`/explore?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-8"
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Explore</h1>
        <p className="text-gray-400 mb-6">Discover users and connect with the community</p>
        
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              className="w-full bg-slate-800/50 border border-indigo-500/30 rounded-2xl p-4 pl-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg text-white placeholder-gray-500 transition-all"
              placeholder="Search by username or address..."
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

      {/* Results */}
      {query && <SearchResults query={query} />}
    </div>
  );
}

function SearchResults({ query }: { query: string }) {
  const { data: results, isLoading } = useQuery<Profile[]>({
    queryKey: ["search", query],
    queryFn: () => api.search(query),
    enabled: query.length >= 2,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="card-3d p-8 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-3d p-12 text-center space-y-4"
      >
        <div className="text-6xl mb-4 float">🔍</div>
        <h3 className="text-xl font-semibold text-white">No users found</h3>
        <p className="text-gray-400">Try searching with a different term</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Search Results</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((profile, idx) => (
          <UserCard key={profile.owner} profile={profile} index={idx} />
        ))}
      </div>
    </div>
  );
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
