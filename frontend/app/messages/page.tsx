"use client";

import { useEffect, useState } from "react";
import { Buffer } from "buffer";
import { useAccount } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ChatMessage, Conversation, Profile } from "../../lib/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function formatTime(ts: number) {
  const date = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "Just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return date.toLocaleDateString();
}

export default function MessagesPage() {
  const { address } = useAccount();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const chatWith = searchParams.get("chat") || "";

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: conversations, isLoading: loadingConvs } = useQuery<Conversation[]>({
    queryKey: ["conversations", address],
    queryFn: () => (address ? api.conversations(address) : Promise.resolve([])),
    enabled: Boolean(address && mounted),
    refetchInterval: 10_000,
  });

  if (!mounted) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="glass rounded-3xl p-6">
          <p className="text-white/70">Loading...</p>
        </div>
      </main>
    );
  }

  if (!address) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="glass rounded-3xl p-6 text-center space-y-4">
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-white/70">Connect your wallet to send messages</p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="glass rounded-3xl overflow-hidden">
        <div className="grid md:grid-cols-3 gap-0 h-[600px]">
          {/* Conversations List */}
          <div className="border-r border-white/10 overflow-y-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold">Conversations</h2>
              <Link href="/conversations" className="text-sm text-indigo-400 hover:underline">
                View all
              </Link>
            </div>
            {loadingConvs ? (
              <div className="p-4 text-white/70">Loading...</div>
            ) : conversations && conversations.length > 0 ? (
              <div>
                {conversations.slice(0, 10).map((conv) => (
                  <ConversationItem
                    key={conv.address}
                    conversation={conv}
                    currentUser={address}
                    isActive={chatWith.toLowerCase() === conv.address.toLowerCase()}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-white/70 text-sm">No conversations yet</div>
            )}
          </div>

          {/* Chat Interface */}
          <div className="md:col-span-2 flex flex-col">
            {chatWith ? (
              <ChatInterface currentUser={address} otherUser={chatWith} />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="space-y-3">
                  <p className="text-xl font-semibold">Select a conversation</p>
                  <p className="text-white/70 text-sm">Choose a conversation from the list or start a new one</p>
                  <NewMessageForm currentUser={address} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ConversationItem({
  conversation,
  currentUser,
  isActive,
}: {
  conversation: Conversation;
  currentUser: string;
  isActive: boolean;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    api
      .profileByOwner(conversation.address)
      .then((p) => {
        if (active) setProfile(p);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [conversation.address]);

  const displayName = profile?.displayName || profile?.handle || conversation.address.slice(0, 6) + "..." + conversation.address.slice(-4);
  const isFromMe = conversation.lastMessage?.from.toLowerCase() === currentUser.toLowerCase();
  const preview = conversation.lastMessage
    ? isFromMe
      ? `You: ${getMessagePreview(conversation.lastMessage.content)}`
      : getMessagePreview(conversation.lastMessage.content)
    : "No messages";

  return (
    <Link
      href={`/messages?chat=${conversation.address}`}
      className={`block p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
        isActive ? "bg-white/10 border-indigo-500/50" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold truncate text-sm">{displayName}</p>
            {conversation.unreadCount > 0 && (
              <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">{conversation.unreadCount}</span>
            )}
          </div>
          <p className="text-xs text-white/70 truncate">{preview}</p>
        </div>
        {conversation.lastMessage && (
          <span className="text-xs text-white/50 ml-2 whitespace-nowrap">{formatTime(conversation.lastMessage.timestamp)}</span>
        )}
      </div>
    </Link>
  );
}

function ChatInterface({ currentUser, otherUser }: { currentUser: string; otherUser: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    api
      .profileByOwner(otherUser)
      .then((p) => {
        if (active) setProfile(p);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [otherUser]);

  const { data: messages, isLoading } = useQuery<ChatMessage[]>({
    queryKey: ["messages", currentUser, otherUser],
    queryFn: () => api.messages(currentUser, otherUser),
    enabled: Boolean(currentUser && otherUser),
    refetchInterval: 5_000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!text.trim()) throw new Error("Message cannot be empty");
      // Send message directly via API
      await api.sendMessage(currentUser, otherUser, text.trim());
      return text.trim();
    },
    onSuccess: () => {
      setText("");
      setStatus(null);
      queryClient.invalidateQueries({ queryKey: ["messages", currentUser, otherUser] });
      queryClient.invalidateQueries({ queryKey: ["conversations", currentUser] });
    },
    onError: (err: any) => {
      setStatus(err.message || "Failed to send");
    },
  });

  const displayName = profile?.displayName || profile?.handle || otherUser.slice(0, 6) + "..." + otherUser.slice(-4);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <p className="font-semibold">{displayName}</p>
          <p className="text-xs text-white/60">{otherUser}</p>
        </div>
        <Link href={`/profile?user=${otherUser}`} className="text-sm text-indigo-400 hover:underline">
          View profile
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center text-white/70 py-8">Loading messages...</div>
        ) : messages && messages.length > 0 ? (
          messages.map((msg, idx) => {
            const isMe = msg.from.toLowerCase() === currentUser.toLowerCase();
            return <MessageBubble key={idx} message={msg} isMe={isMe} />;
          })
        ) : (
          <div className="text-center text-white/70 py-8">No messages yet. Start the conversation!</div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {status && <p className="text-xs text-red-400">{status}</p>}
        <div className="flex gap-2">
          <textarea
            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-sm resize-none"
            rows={2}
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (text.trim() && !sendMutation.isPending) {
                  sendMutation.mutate();
                }
              }
            }}
          />
          <button
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 self-end"
            disabled={!text.trim() || sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
          >
            {sendMutation.isPending ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>➤</span>
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message, isMe }: { message: ChatMessage; isMe: boolean }) {
  // Messages now use direct content, no need to fetch from IPFS
  const content = message.content || "";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl p-3 ${
          isMe ? "bg-indigo-500 text-white" : "bg-white/10 text-white"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <p className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
      </div>
    </div>
  );
}

function NewMessageForm({ currentUser }: { currentUser: string }) {
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function send() {
    if (!to || to.length !== 42) {
      setStatus("Invalid address");
      return;
    }
    if (!text.trim()) {
      setStatus("Message cannot be empty");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      // Send message directly via API
      await api.sendMessage(currentUser, to, text.trim());
      setStatus("Message sent! Redirecting...");
      setTimeout(() => {
        window.location.href = `/messages?chat=${to}`;
      }, 1000);
    } catch (err: any) {
      setStatus(err.message || "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-4 space-y-3 max-w-md mx-auto">
      <h3 className="font-semibold">Start a new conversation</h3>
      <input
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
        placeholder="Recipient address (0x...)"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <textarea
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm"
        rows={3}
        placeholder="Your message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button 
        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2" 
        disabled={!text || !to || loading} 
        onClick={send}
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>➤</span>
            <span>Send message</span>
          </>
        )}
      </button>
      {status && <p className="text-xs text-white/70">{status}</p>}
    </div>
  );
}

function getMessagePreview(cid: string): string {
  return "Message";
}
