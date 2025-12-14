import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, Post, Profile } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Composer } from "./Composer";
import classNames from "classnames";
import Link from "next/link";

function formatTime(ts: number) {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "now";
}

function typeLabel(post: Post) {
  if (post.postType === 1) return "Retweet";
  if (post.postType === 2) return "Quote";
  if (post.postType === 3) return "Comment";
  return "Post";
}

export function PostCard({ post, showComments = false, isComment = false }: { post: Post; showComments?: boolean; isComment?: boolean }) {
  const { address } = useAccount();
  const [showComment, setShowComment] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false); // Hidden by default
  const queryClient = useQueryClient();

  // Fetch profile for the post author
  const { data: authorProfile } = useQuery<Profile>({
    queryKey: ["profile", post.author],
    queryFn: () => api.profileByOwner(post.author),
    enabled: !!post.author,
    retry: false,
  });

  // Fetch comments for this post
  const { data: allPosts } = useQuery<Post[]>({
    queryKey: ["feed"],
    queryFn: api.feed,
    enabled: showAllComments && post.postType === 0,
  });

  const comments = allPosts?.filter((p) => p.postType === 3 && p.referenceId === post.id) || [];

  // Check if current user is following the author
  const { data: following } = useQuery<string[]>({
    queryKey: ["following", address],
    queryFn: () => (address ? api.following(address) : Promise.resolve([])),
    enabled: !!address,
    retry: false,
  });

  const isFollowing = following?.map((f) => f.toLowerCase()).includes(post.author.toLowerCase()) || false;

  // Check if user has liked/retweeted
  const { data: likeStatus } = useQuery<{ liked: boolean }>({
    queryKey: ["likeStatus", post.id, address],
    queryFn: () => (address ? api.hasLiked(post.id, address) : Promise.resolve({ liked: false })),
    enabled: !!address && !!post.id,
    retry: false,
  });

  const { data: retweetStatus } = useQuery<{ retweeted: boolean }>({
    queryKey: ["retweetStatus", post.id, address],
    queryFn: () => (address ? api.hasRetweeted(post.id, address) : Promise.resolve({ retweeted: false })),
    enabled: !!address && !!post.id,
    retry: false,
  });

  const isLiked = likeStatus?.liked || false;
  const isRetweeted = retweetStatus?.retweeted || false;

  const displayName = authorProfile?.displayName || authorProfile?.handle || `${post.author.slice(0, 6)}...${post.author.slice(-4)}`;
  const avatarUrl = authorProfile?.avatarCid
    ? `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${authorProfile.avatarCid}`
    : null;
  const mediaUrl = post.mediaCid
    ? `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${post.mediaCid}`
    : null;

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect wallet first");
      return api.like(address, post.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      queryClient.invalidateQueries({ queryKey: ["posts", "author"] });
      queryClient.invalidateQueries({ queryKey: ["likeStatus", post.id, address] });
      queryClient.invalidateQueries({ queryKey: ["notifications", post.author] });
    },
  });

  const retweetMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect wallet first");
      if (isRetweeted) {
        // Unretweet - find the retweet post and delete it
        const allPosts = await api.feed();
        let retweetPost = allPosts.find(
          (p) =>
            p.postType === 1 &&
            p.referenceId === post.id &&
            p.author.toLowerCase() === address.toLowerCase() &&
            !p.deleted
        );
        
        // If not found in feed, try to find it by querying posts by author
        if (!retweetPost) {
          try {
            const userPosts = await api.postsByAuthor(address);
            retweetPost = userPosts.find(
              (p) =>
                p.postType === 1 &&
                p.referenceId === post.id &&
                !p.deleted
            );
          } catch (err) {
            // Ignore error, will throw below if not found
          }
        }
        
        if (retweetPost) {
          await api.del(address, retweetPost.id);
        } else {
          throw new Error("Retweet post not found");
        }
      } else {
        await api.retweet(address, post.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["posts", "author"] });
      queryClient.invalidateQueries({ queryKey: ["retweetStatus", post.id, address] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", post.author] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect wallet first");
      if (address.toLowerCase() !== post.author.toLowerCase()) {
        throw new Error("You can only delete your own posts");
      }
      return api.del(address, post.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      queryClient.invalidateQueries({ queryKey: ["posts", "author"] });
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect wallet first");
      // Toggle: if following, unfollow; if not following, follow
      if (isFollowing) {
        return api.unfollow(address, post.author);
      } else {
        return api.follow(address, post.author);
      }
    },
      onSuccess: async () => {
        // Invalidate and refetch all related queries immediately
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["following", address] }),
          queryClient.invalidateQueries({ queryKey: ["followers", post.author] }),
          queryClient.invalidateQueries({ queryKey: ["profile", post.author] }),
          queryClient.invalidateQueries({ queryKey: ["feed"] }),
          queryClient.invalidateQueries({ queryKey: ["notifications", post.author] }),
        ]);
        // Force immediate refetch to update UI
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["followers", post.author] }),
          queryClient.refetchQueries({ queryKey: ["following", address] }),
        ]);
      },
  });

  // Only show main posts, not comments (comments will be shown as replies)
  if (post.postType === 3 && !isComment) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={classNames(
        "card-3d p-6 space-y-4",
        isComment && "ml-8 border-l-2 border-indigo-500/30 pl-6"
      )}
    >
      <div className="flex items-start gap-4">
        <Link href={`/profile?user=${post.author}`} className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500/50 shadow-lg"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/profile?user=${post.author}`}
                className="font-bold text-lg hover:text-indigo-400 transition-colors"
              >
                {displayName}
              </Link>
              {authorProfile?.handle && (
                <span className="text-sm opacity-60">@{authorProfile.handle}</span>
              )}
              <span className="text-sm opacity-40">·</span>
              <span className="text-sm opacity-60">{formatTime(post.timestamp)}</span>
            </div>
            <div className="flex items-center gap-2">
              {address && address.toLowerCase() === post.author.toLowerCase() && (
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this post?")) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                  title="Delete post"
                >
                  🗑️
                </button>
              )}
              {address && address.toLowerCase() !== post.author.toLowerCase() && (
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  className={classNames(
                    "px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105",
                    isFollowing
                      ? "bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30"
                      : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
                  )}
                >
                  {followMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      <span>...</span>
                    </span>
                  ) : isFollowing ? (
                    <span className="flex items-center gap-2">
                      <span>✓</span>
                      <span>Following</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>+</span>
                      <span>Follow</span>
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
          {post.postType !== 0 && (
            <div className="mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs rounded-full font-medium">
                {typeLabel(post)}
              </span>
            </div>
          )}
        </div>
      </div>

      {post.content && (
        <p
          className={classNames("leading-relaxed text-base whitespace-pre-wrap break-words", {
            "opacity-80 italic": post.postType === 1,
          })}
        >
          {post.content.split(/(@PolyXBot|@polyxbot)/i).map((part, idx) => 
            /@polyxbot/i.test(part) ? (
              <span key={idx} className="text-indigo-400 font-semibold">@PolyXBot</span>
            ) : (
              <span key={idx}>{part}</span>
            )
          )}
        </p>
      )}

      {mediaUrl && (
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-xl">
          <img src={mediaUrl} alt="Post media" className="w-full h-auto max-h-96 object-cover" />
        </div>
      )}

      <div className="flex items-center gap-8 pt-3 border-t border-white/10">
        <button
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all group ${
            isLiked
              ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
              : "hover:bg-red-500/10 hover:text-red-400"
          }`}
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending || !address}
        >
          <span className={`text-xl group-hover:scale-110 transition-transform ${isLiked ? "text-red-400" : ""}`}>
            {isLiked ? "❤️" : "🤍"}
          </span>
          <span className={`text-sm font-semibold ${isLiked ? "text-red-400" : ""}`}>{post.likeCount || 0}</span>
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all group shadow-md hover:shadow-lg transform hover:scale-105 ${
            isRetweeted
              ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/30"
              : "bg-white/5 hover:bg-green-500/10 hover:text-green-400 text-white/70"
          }`}
          onClick={() => retweetMutation.mutate()}
          disabled={retweetMutation.isPending || !address}
        >
          <span className={`text-xl group-hover:scale-110 transition-transform ${isRetweeted ? "text-green-400" : ""}`}>
            {isRetweeted ? "🔁✓" : "🔁"}
          </span>
          <span className={`text-sm font-semibold ${isRetweeted ? "text-green-400" : ""}`}>{post.retweetCount || 0}</span>
        </button>
        <button
          className="flex items-center gap-2 hover:text-indigo-400 transition-all group"
          onClick={() => setShowComment(!showComment)}
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
          <span className="text-sm font-semibold">{post.commentCount || 0}</span>
        </button>
        {post.referenceId && (
          <Link
            href={`/post/${post.referenceId}`}
            className="text-sm opacity-60 hover:opacity-100 transition-opacity"
          >
            View original
          </Link>
        )}
      </div>

      {/* Comments Section - Hidden by default */}
      {post.postType === 0 && comments.length > 0 && (
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setShowAllComments(!showAllComments)}
            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {showAllComments ? "▼ Hide" : "▶ Show"} {comments.length} comment{comments.length !== 1 ? "s" : ""}
          </button>
          <AnimatePresence>
            {showAllComments && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 mt-3"
              >
                {comments.map((comment) => (
                  <PostCard key={comment.id} post={comment} isComment={true} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showComment && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-4 border-t border-white/10"
          >
            <Composer mode="comment" referenceId={post.id} onDone={() => setShowComment(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {likeMutation.error && (
        <p className="text-red-400 text-sm">{(likeMutation.error as Error).message}</p>
      )}
      {retweetMutation.error && (
        <p className="text-red-400 text-sm">{(retweetMutation.error as Error).message}</p>
      )}
      {followMutation.error && (
        <p className="text-red-400 text-sm">{(followMutation.error as Error).message}</p>
      )}
      {deleteMutation.error && (
        <p className="text-red-400 text-sm">{(deleteMutation.error as Error).message}</p>
      )}
    </motion.div>
  );
}
