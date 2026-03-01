"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, Post } from "../../../lib/api";
import { PostCard } from "../../../components/PostCard";
import Link from "next/link";

export default function PostPage() {
  const params = useParams();
  const id = parseInt(params.id as string, 10);

  const { data: post, isLoading, error } = useQuery<Post>({
    queryKey: ["post", id],
    queryFn: () => api.post(id),
    enabled: !isNaN(id) && id > 0,
  });

  if (isNaN(id) || id < 1) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="card-3d p-10 text-center">
          <p className="text-xl opacity-80">Invalid post ID</p>
          <Link href="/" className="btn-primary inline-block mt-4">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="card p-6 space-y-3 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/4" />
          <div className="h-4 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-1/2" />
        </div>
      </main>
    );
  }

  if (error || !post || post.deleted) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="card-3d p-10 text-center">
          <p className="text-xl opacity-80">Post not found or deleted</p>
          <Link href="/" className="btn-primary inline-block mt-4">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
        ← Back to Feed
      </Link>
      <PostCard post={post} showComments />
    </main>
  );
}
