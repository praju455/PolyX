"use client";

import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { api, Profile } from "../../lib/api";
import Link from "next/link";
import { motion } from "framer-motion";

function formatTime(ts: number) {
  const date = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-3d p-12 text-center space-y-4"
        >
          <div className="text-6xl mb-4 float">🔔</div>
          <h1 className="text-3xl font-bold gradient-text">Notifications</h1>
          <p className="text-gray-400">Connect your wallet to see notifications</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold gradient-text mb-2">Notifications</h1>
        <p className="text-gray-400">Stay updated with your activity</p>
      </motion.div>
      <NotificationsList user={address} />
    </div>
  );
}

function NotificationsList({ user }: { user: string }) {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user],
    queryFn: () => api.notifications(user),
    enabled: Boolean(user),
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="card-3d p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white/10 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-3d p-12 text-center space-y-4"
      >
        <div className="text-6xl mb-4 float">🔔</div>
        <h3 className="text-xl font-semibold text-white">No notifications yet</h3>
        <p className="text-gray-400">You'll see notifications here when someone interacts with your content</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notif, idx) => (
        <NotificationItem key={idx} notification={notif} index={idx} />
      ))}
    </div>
  );
}

function NotificationItem({ 
  notification, 
  index 
}: { 
  notification: { type: "like" | "quote" | "comment" | "follow"; from: string; postId?: number; timestamp: number };
  index: number;
}) {
  const { data: profile } = useQuery<Profile>({
    queryKey: ["profile", notification.from],
    queryFn: () => api.profileByOwner(notification.from),
    enabled: Boolean(notification.from),
    retry: false,
  });

  const displayName = profile?.displayName || profile?.handle || `${notification.from.slice(0, 6)}...${notification.from.slice(-4)}`;
  const avatarUrl = profile?.avatarCid
    ? `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${profile.avatarCid}`
    : null;

  const icons = {
    like: "❤️",
    quote: "💬",
    comment: "💭",
    follow: "👤",
  };

  const colors = {
    like: "from-red-500/20 to-pink-500/20 border-red-500/30",
    quote: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    comment: "from-purple-500/20 to-indigo-500/20 border-purple-500/30",
    follow: "from-green-500/20 to-emerald-500/20 border-green-500/30",
  };

  const messages = {
    like: "liked your post",
    quote: "quoted your post",
    comment: "commented on your post",
    follow: "started following you",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`card-3d p-5 bg-gradient-to-r ${colors[notification.type]} hover:scale-[1.02] transition-transform cursor-pointer group`}
    >
      <Link
        href={notification.postId ? `/post/${notification.postId}` : `/profile?user=${notification.from}`}
        className="flex items-center gap-4"
      >
        {avatarUrl ? (
          <div className="relative">
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-500/50 group-hover:border-indigo-400 transition-all shadow-lg" 
            />
            <div className="absolute -top-1 -right-1 text-2xl">{icons[notification.type]}</div>
          </div>
        ) : (
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -top-1 -right-1 text-2xl">{icons[notification.type]}</div>
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-white">
            <Link 
              href={`/profile?user=${notification.from}`} 
              className="hover:text-indigo-300 transition-colors"
            >
              {displayName}
            </Link>
            <span className="text-gray-300 ml-2">{messages[notification.type]}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{formatTime(notification.timestamp)}</p>
        </div>
        <div className="text-indigo-400 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all">
          →
        </div>
      </Link>
    </motion.div>
  );
}
