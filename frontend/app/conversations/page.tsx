"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { api, Conversation, Profile } from "../../lib/api";
import Link from "next/link";

function formatTime(ts: number) {
  const date = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return date.toLocaleDateString();
}

export default function ConversationsPage() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ["conversations", address],
    queryFn: () => (address ? api.conversations(address) : Promise.resolve([])),
    enabled: Boolean(address && mounted),
    refetchInterval: 10_000,
  });

  if (!mounted) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="glass rounded-3xl p-6">
          <p className="text-white/70">Loading...</p>
        </div>
      </main>
    );
  }

  if (!address) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="glass rounded-3xl p-6 text-center space-y-4">
          <h1 className="text-3xl font-bold">Conversations</h1>
          <p className="text-white/70">Connect your wallet to see conversations</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Conversations</h1>
          <Link href="/messages" className="btn-primary">
            New message
          </Link>
        </div>
        {isLoading ? (
          <p className="text-white/70">Loading conversations...</p>
        ) : conversations && conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <ConversationItem key={conv.address} conversation={conv} currentUser={address} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 space-y-3">
            <p className="text-white/70">No conversations yet</p>
            <Link href="/messages" className="btn-primary inline-block">
              Start a conversation
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

function ConversationItem({ conversation, currentUser }: { conversation: Conversation; currentUser: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .profileByOwner(conversation.address)
      .then((p) => {
        if (active) setProfile(p);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [conversation.address]);

  const displayName = profile?.displayName || profile?.handle || conversation.address.slice(0, 6) + "..." + conversation.address.slice(-4);
  const isFromMe = conversation.lastMessage?.from.toLowerCase() === currentUser.toLowerCase();
  const preview = conversation.lastMessage 
    ? (isFromMe 
        ? `You: ${getMessagePreview(conversation.lastMessage.content)}` 
        : getMessagePreview(conversation.lastMessage.content)) 
    : "No messages";

  return (
    <Link
      href={`/messages?chat=${conversation.address}`}
      className="block glass border border-white/5 rounded-2xl p-4 hover:border-indigo-500/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold truncate">{displayName}</p>
            {conversation.unreadCount > 0 && (
              <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">{conversation.unreadCount}</span>
            )}
          </div>
          <p className="text-sm text-white/70 truncate">{preview}</p>
        </div>
        {conversation.lastMessage && (
          <span className="text-xs text-white/50 ml-4 whitespace-nowrap">{formatTime(conversation.lastMessage.timestamp)}</span>
        )}
      </div>
    </Link>
  );
}

function getMessagePreview(content: string): string {
  if (!content) return "No message";
  // Truncate long messages
  if (content.length > 50) {
    return content.substring(0, 50) + "...";
  }
  return content;
}

