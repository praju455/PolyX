"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useAccount } from "wagmi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ChatMessage, Conversation, Profile } from "../../lib/api";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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

function MessagingContent() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const chatWith = searchParams.get("chat") || "";
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    
    setIsSearching(true);
    try {
      // Try to get profile by handle
      try {
        const profile = await api.profileByHandle(searchQuery.trim());
        setSearchResults([profile]);
        router.push(`/messaging?chat=${profile.owner}`);
      } catch {
        // If handle search fails, try address search
        if (searchQuery.trim().startsWith("0x") && searchQuery.trim().length === 42) {
          try {
            const profile = await api.profileByOwner(searchQuery.trim());
            setSearchResults([profile]);
            router.push(`/messaging?chat=${profile.owner}`);
          } catch {
            setSearchResults([]);
          }
        } else {
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  if (!mounted) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="card p-6">
          <p className="opacity-70">Loading...</p>
        </div>
      </main>
    );
  }

  if (!isConnected || !address) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="card p-8 text-center space-y-4">
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="opacity-70">Connect your wallet to send and receive messages</p>
        </div>
      </main>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="card-3d overflow-hidden">
        <div className="grid md:grid-cols-3 gap-0 h-[700px]">
          {/* Conversations List */}
          <div className="border-r border-indigo-500/20 overflow-y-auto bg-slate-800/30 flex flex-col">
            <div className="p-4 border-b border-indigo-500/20 bg-slate-800/50">
              <h2 className="text-xl font-bold mb-3 gradient-text">Conversations</h2>
              <UserSearchForm currentUser={address} />
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationsList currentUser={address} activeChat={chatWith} />
            </div>
          </div>

          {/* Chat Interface */}
          <div className="md:col-span-2 flex flex-col">
            {chatWith ? (
              <ChatInterface currentUser={address} otherUser={chatWith} />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="space-y-4 max-w-md">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-xl font-semibold">Select a conversation</p>
                  <p className="opacity-70 text-sm">Choose a conversation from the list or start a new one</p>
                  <NewMessageForm currentUser={address} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConversationsList({ currentUser, activeChat }: { currentUser: string; activeChat: string }) {
  const { data: conversations, isPending } = useQuery<Conversation[]>({
    queryKey: ["conversations", currentUser],
    queryFn: () => api.conversations(currentUser),
    enabled: Boolean(currentUser),
    refetchInterval: 10_000,
  });

  if (isPending) {
    return <div className="p-4 opacity-70">Loading conversations...</div>;
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-4 text-center opacity-70 text-sm">
        <p>No conversations yet</p>
        <p className="mt-2">Start a new conversation to begin messaging</p>
      </div>
    );
  }

  return (
    <div>
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.address}
          conversation={conv}
          currentUser={currentUser}
          isActive={activeChat.toLowerCase() === conv.address.toLowerCase()}
        />
      ))}
    </div>
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
      ? `You: ${conversation.lastMessage.content || "Message"}`
      : conversation.lastMessage.content || "Message"
    : "No messages";

  const avatarUrl = profile?.avatarCid
    ? `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${profile.avatarCid}`
    : null;

  return (
    <Link
      href={`/messaging?chat=${conversation.address}`}
      className={`block p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
        isActive ? "bg-indigo-500/20 border-indigo-500/50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/50" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg font-bold text-white">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold truncate text-sm">{displayName}</p>
            {conversation.unreadCount > 0 && (
              <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">{conversation.unreadCount}</span>
            )}
          </div>
          <p className="text-xs opacity-70 truncate">{preview}</p>
          {conversation.lastMessage && (
            <span className="text-xs opacity-50">{formatTime(conversation.lastMessage.timestamp)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ChatInterface({ currentUser, otherUser }: { currentUser: string; otherUser: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [isBlocked, setIsBlocked] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [showMessageInfo, setShowMessageInfo] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    let active = true;
    api
      .profileByOwner(otherUser)
      .then((p) => {
        if (active) setProfile(p);
      })
      .catch(() => {});
    
    // Check if user is blocked
    api.isBlocked(currentUser, otherUser)
      .then((result) => {
        if (active) setIsBlocked(result.blocked);
      })
      .catch(() => {});
    
    return () => {
      active = false;
    };
  }, [otherUser, currentUser]);

  const { data: messages, isPending } = useQuery<ChatMessage[]>({
    queryKey: ["messages", currentUser, otherUser],
    queryFn: () => api.messages(currentUser, otherUser),
    enabled: Boolean(currentUser && otherUser),
    refetchInterval: 3_000, // Poll every 3 seconds for new messages
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!text.trim()) throw new Error("Message cannot be empty");
      return await api.sendMessage(currentUser, otherUser, text.trim());
    },
    onSuccess: () => {
      setText("");
      setStatus(null);
      queryClient.invalidateQueries({ queryKey: ["messages", currentUser, otherUser] });
      queryClient.invalidateQueries({ queryKey: ["conversations", currentUser] });
    },
    onError: (err: any) => {
      console.error("Message send error:", err);
      setStatus(err.message || "Failed to send message. Please try again.");
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: () => api.clearChat(currentUser, otherUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", currentUser, otherUser] });
      queryClient.invalidateQueries({ queryKey: ["conversations", currentUser] });
      setShowMenu(false);
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => api.blockUser(currentUser, otherUser),
    onSuccess: () => {
      setIsBlocked(true);
      setShowMenu(false);
      queryClient.invalidateQueries({ queryKey: ["messages", currentUser, otherUser] });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: () => api.unblockUser(currentUser, otherUser),
    onSuccess: () => {
      setIsBlocked(false);
      setShowMenu(false);
      queryClient.invalidateQueries({ queryKey: ["messages", currentUser, otherUser] });
    },
  });

  const displayName = profile?.displayName || profile?.handle || otherUser.slice(0, 6) + "..." + otherUser.slice(-4);
  const avatarUrl = profile?.avatarCid
    ? `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${profile.avatarCid}`
    : null;

  const toggleMessageSelection = (messageId: string) => {
    setSelectedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900">
      {/* Header - Custom style */}
      <div className="p-3 border-b border-indigo-500/20 flex items-center justify-between bg-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 flex-1">
          {selectedMessages.size > 0 ? (
            <>
              <button
                onClick={() => {
                  setSelectedMessages(new Set());
                  setShowDeleteOptions(false);
                }}
                className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                ✕
              </button>
              <span className="text-white font-semibold">{selectedMessages.size} selected</span>
              <div className="ml-auto flex items-center gap-2 relative">
                <button
                  onClick={() => setShowDeleteOptions(!showDeleteOptions)}
                  className="text-indigo-400 hover:text-indigo-300 p-2 transition-colors"
                  title="Delete options"
                >
                  ^
                </button>
                {showDeleteOptions && (
                  <div className="absolute right-0 top-full mt-2 bg-slate-800 rounded-lg shadow-xl border border-indigo-500/20 min-w-[180px] z-50">
                    <button
                      onClick={() => {
                        // Delete for me
                        selectedMessages.forEach((id) => {
                          api.deleteMessage(id, currentUser).catch(console.error);
                        });
                        setSelectedMessages(new Set());
                        setShowDeleteOptions(false);
                        queryClient.invalidateQueries({ queryKey: ["messages", currentUser, otherUser] });
                      }}
                      className="w-full text-left px-4 py-3 text-white hover:bg-indigo-500/20 transition-colors"
                    >
                      🗑️ Delete for me
                    </button>
                    <button
                      onClick={() => {
                        // Delete for everyone
                        if (confirm("Delete for everyone? This cannot be undone.")) {
                          selectedMessages.forEach((id) => {
                            api.deleteMessage(id, currentUser).catch(console.error);
                          });
                          setSelectedMessages(new Set());
                          setShowDeleteOptions(false);
                          queryClient.invalidateQueries({ queryKey: ["messages", currentUser, otherUser] });
                        }
                      }}
                      className="w-full text-left px-4 py-3 text-white hover:bg-indigo-500/20 transition-colors"
                    >
                      🗑️ Delete for everyone
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/50" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-white">{displayName}</p>
                <p className="text-xs opacity-70 text-white">{isBlocked ? "Blocked" : "Online"}</p>
              </div>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  ⋮
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-slate-800 rounded-lg shadow-xl border border-indigo-500/20 min-w-[200px] z-50">
                    <button
                      onClick={() => {
                        if (isBlocked) {
                          unblockMutation.mutate();
                        } else {
                          blockMutation.mutate();
                        }
                      }}
                      className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition-colors"
                    >
                      {isBlocked ? "🔓 Unblock" : "🚫 Block"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Clear all messages in this chat?")) {
                          clearChatMutation.mutate();
                        }
                      }}
                      className="w-full text-left px-4 py-3 text-white hover:bg-white/10 transition-colors"
                    >
                      🗑️ Clear Chat
                    </button>
                    <Link
                      href={`/profile?user=${otherUser}`}
                      className="block w-full text-left px-4 py-3 text-white hover:bg-white/10 transition-colors"
                    >
                      👤 View Profile
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages - Custom background */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 bg-gradient-to-b from-slate-900/50 to-slate-800/30"
      >
        {isPending ? (
          <div className="text-center opacity-70 py-8 text-white">Loading messages...</div>
        ) : isBlocked ? (
          <div className="text-center py-8 text-white/70">
            <p>You have blocked this user. Unblock to send messages.</p>
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {messages.map((msg, idx) => {
              const isMe = msg.from.toLowerCase() === currentUser.toLowerCase();
              return (
                <MessageBubble
                  key={msg.id || idx}
                  message={msg}
                  isMe={isMe}
                  currentUser={currentUser}
                  isSelected={selectedMessages.has(msg.id || "")}
                  onSelect={() => {
                    if (msg.id) toggleMessageSelection(msg.id);
                  }}
                  selectionMode={selectedMessages.size > 0}
                  onShowInfo={(messageId) => setShowMessageInfo(messageId)}
                />
              );
            })}
            {showMessageInfo && (
              <MessageInfoModal
                messageId={showMessageInfo}
                message={messages?.find((m) => m.id === showMessageInfo)}
                onClose={() => setShowMessageInfo(null)}
              />
            )}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center opacity-70 py-8 text-white/70">
            <div className="text-4xl mb-2">💭</div>
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Input - Custom style */}
      {!isBlocked && (
        <div className="p-3 border-t border-indigo-500/20 bg-slate-800/50 backdrop-blur-sm">
          {status && <p className="text-xs text-red-400 mb-2">{status}</p>}
          <div className="flex gap-2 items-end">
            <div className="flex-1 bg-slate-700/50 rounded-2xl px-4 py-2 flex items-end border border-indigo-500/20">
              <textarea
                className="flex-1 bg-transparent text-white placeholder-white/50 resize-none focus:outline-none text-sm"
                rows={1}
                placeholder="Type a message..."
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (text.trim() && !sendMutation.isPending) {
                      sendMutation.mutate();
                    }
                  }
                }}
                style={{ maxHeight: "100px" }}
              />
            </div>
            <button
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl px-6 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold flex items-center gap-2"
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
      )}
    </div>
  );
}

function MessageBubble({
  message,
  isMe,
  currentUser,
  isSelected,
  onSelect,
  selectionMode,
  onShowInfo,
}: {
  message: ChatMessage;
  isMe: boolean;
  currentUser: string;
  isSelected?: boolean;
  onSelect?: () => void;
  selectionMode?: boolean;
  onShowInfo?: (messageId: string) => void;
}) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!message.id) throw new Error("Message ID not found");
      return await api.deleteMessage(message.id, currentUser);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: any) => {
      console.error("Delete message error:", err);
    },
  });

  const isDeleted = message.deleted || message.content === "This message was deleted";
  const isRead = message.read && message.read > 0;
  const showBlueTick = isMe && isRead; // Blue tick for read messages

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isMe ? "justify-end" : "justify-start"} px-2 py-1`}
      onClick={selectionMode ? onSelect : undefined}
      onDoubleClick={() => {
        if (!selectionMode && message.id && onShowInfo) {
          onShowInfo(message.id);
        }
      }}
    >
      <div
        className={`max-w-[65%] rounded-xl px-4 py-2 ${
          isSelected
            ? "bg-indigo-500/30 border-2 border-indigo-500"
            : isMe
            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
            : "bg-slate-700/80 text-white border border-slate-600/50"
        } ${selectionMode ? "cursor-pointer" : ""}`}
      >
        {isDeleted ? (
          <p className="text-sm italic opacity-70">This message was deleted</p>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] opacity-70">{formatTime(message.timestamp)}</span>
          {isMe && (
            <span className="text-[10px] opacity-70 ml-1">
              {showBlueTick ? (
                <span className="text-blue-400 font-bold">✓✓</span>
              ) : (
                <span className="opacity-50">✓</span>
              )}
            </span>
          )}
          {selectionMode && (
            <span className={`ml-2 ${isSelected ? "text-indigo-400" : "opacity-30"}`}>
              {isSelected ? "✓" : "○"}
            </span>
          )}
        </div>
      </div>
      {!selectionMode && isMe && !isDeleted && (
        <div className="ml-1 flex flex-col gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (message.id && onShowInfo) {
                onShowInfo(message.id);
              }
            }}
            className="text-white/50 hover:text-white/80 transition-colors p-1 text-xs"
            title="Message info"
          >
            i
          </button>
        </div>
      )}
    </motion.div>
  );
}

function NewMessageForm({ currentUser }: { currentUser: string }) {
  const router = useRouter();
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function send() {
    if (!to || to.length !== 42) {
      setStatus("Invalid address (must be 42 characters starting with 0x)");
      return;
    }
    if (!text.trim()) {
      setStatus("Message cannot be empty");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      await api.sendMessage(currentUser, to, text.trim());
      setStatus("Message sent! Redirecting...");
      setTimeout(() => {
        router.push(`/messaging?chat=${to}`);
      }, 1000);
    } catch (err: any) {
      setStatus(err.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 space-y-3 max-w-md mx-auto">
      <h3 className="font-semibold">Start a new conversation</h3>
      <input
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="Recipient address (0x...)"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <textarea
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
      {status && <p className="text-xs opacity-70">{status}</p>}
    </div>
  );
}


function MessageInfoModal({
  messageId,
  message,
  onClose,
}: {
  messageId: string;
  message: ChatMessage | undefined;
  onClose: () => void;
}) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-indigo-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Message Info</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            ✕
          </button>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-white/70">Content:</p>
            <p className="text-white mt-1">{message.content}</p>
          </div>
          <div>
            <p className="text-white/70">Sent:</p>
            <p className="text-white mt-1">{new Date(message.timestamp).toLocaleString()}</p>
          </div>
          {message.read && (
            <div>
              <p className="text-white/70">Read:</p>
              <p className="text-white mt-1">{new Date(message.read).toLocaleString()}</p>
            </div>
          )}
          <div>
            <p className="text-white/70">Status:</p>
            <p className="text-white mt-1">
              {message.deleted ? "Deleted" : message.read ? "Read ✓✓" : "Sent ✓"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserSearchForm({ currentUser }: { currentUser: string }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setError("Please enter at least 2 characters");
      return;
    }
    
    setIsSearching(true);
    setError(null);
    try {
      // Try to get profile by handle first
      try {
        const profile = await api.profileByHandle(searchQuery.trim());
        router.push(`/messaging?chat=${profile.owner}`);
        setSearchQuery("");
      } catch {
        // If handle search fails, try address search
        if (searchQuery.trim().startsWith("0x") && searchQuery.trim().length === 42) {
          try {
            const profile = await api.profileByOwner(searchQuery.trim());
            router.push(`/messaging?chat=${profile.owner}`);
            setSearchQuery("");
          } catch {
            setError("User not found. Try searching by username or address.");
          }
        } else {
          setError("User not found. Try searching by username or address.");
        }
      }
    } catch (error: any) {
      console.error("Search error:", error);
      setError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Search by username..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setError(null);
          }}
        />
        <button
          type="submit"
          className="btn-primary text-sm px-3 py-2"
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? "..." : "🔍"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}

export default function MessagingPage() {
  return (
    <Suspense fallback={
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="card p-6">
          <p className="opacity-70">Loading...</p>
        </div>
      </main>
    }>
      <MessagingContent />
    </Suspense>
  );
}
