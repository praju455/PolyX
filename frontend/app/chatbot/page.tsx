"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const CHATBOT_HANDLE = "@PolyXBot";
const CHATBOT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Placeholder - you can set a real address

export default function ChatbotPage() {
  const { address, isConnected } = useAccount();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history
  const { data: chatHistory } = useQuery<ChatMessage[]>({
    queryKey: ["chatbot-history", address],
    queryFn: () => (address ? api.getChatbotHistory(address) : Promise.resolve([])),
    enabled: !!address && isConnected && mounted,
  });

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setMessages(chatHistory);
    }
  }, [chatHistory]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      if (!address) throw new Error("Connect wallet first");
      const response = await api.chatWithBot(address, message);
      return response;
    },
    onSuccess: (response) => {
      const botMessage: ChatMessage = {
        role: "assistant",
        content: response.response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    },
    onError: (error) => {
      alert((error as Error).message || "Failed to send message");
      setIsLoading(false);
    },
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !address) return;

    const messageText = input.trim();
    setIsLoading(true);
    setInput(""); // Clear input immediately
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      role: "user",
      content: messageText,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    
    // Send to bot
    sendMessage.mutate(messageText);
  };

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card-3d p-12 text-center space-y-4">
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-3d p-12 text-center space-y-4"
        >
          <div className="text-6xl mb-4">🤖</div>
          <h1 className="text-3xl font-bold gradient-text">PolyX Chatbot</h1>
          <p className="text-gray-400 text-lg mb-2">AI-powered assistant powered by Gemini</p>
          <p className="text-gray-500 text-sm mb-4">
            Tag <span className="text-indigo-400 font-mono">@polyx</span> or <span className="text-indigo-400 font-mono">{CHATBOT_HANDLE}</span> in posts to get AI responses!
          </p>
          <div className="mt-6 space-y-2">
            <div className="text-4xl mb-2">👋</div>
            <h3 className="text-xl font-semibold text-white">Start a conversation</h3>
            <p className="text-gray-400">
              Ask me anything! I can help with questions about PolyX, Web3, blockchain, and more.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <p>💡 <strong>Tip:</strong> Tag <span className="text-indigo-400 font-mono">@polyx</span> or <span className="text-indigo-400 font-mono">{CHATBOT_HANDLE}</span> in any post to get AI-powered responses!</p>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-6">Connect your wallet to start chatting</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-3d p-6 mb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg">
              🤖
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">PolyX Chatbot</h1>
              <p className="text-gray-400 text-sm">AI-powered assistant powered by Gemini</p>
              <p className="text-gray-500 text-xs mt-1">
                Tag <span className="text-indigo-400 font-mono">@polyx</span> or <span className="text-indigo-400 font-mono">{CHATBOT_HANDLE}</span> in posts to get AI responses!
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={async () => {
                if (!address) return;
                try {
                  await api.clearChatbotHistory(address);
                  setMessages([]);
                  queryClient.invalidateQueries({ queryKey: ["chatbot-history", address] });
                } catch (error) {
                  alert((error as Error).message || "Failed to clear chat");
                }
              }}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl text-sm font-medium transition-all border border-red-500/30"
            >
              Clear Chat
            </button>
          )}
        </div>
      </motion.div>

      {/* Messages */}
      <div className="card-3d flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-6xl mb-4">👋</div>
              <h3 className="text-xl font-semibold text-white">Start a conversation</h3>
              <p className="text-gray-400">
                Ask me anything! I can help with questions about PolyX, Web3, blockchain, and more.
              </p>
              <div className="mt-6 space-y-2 text-sm text-gray-500">
                <p>💡 <strong>Tip:</strong> Tag <span className="text-indigo-400 font-mono">@polyx</span> or <span className="text-indigo-400 font-mono">{CHATBOT_HANDLE}</span> in any post to get AI-powered responses!</p>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                        : "bg-slate-800/50 text-white border border-indigo-500/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm flex-shrink-0">
                          🤖
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className="text-xs opacity-60 mt-2">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {msg.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-sm flex-shrink-0">
                          👤
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-slate-800/50 rounded-2xl p-4 border border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    🤖
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-indigo-500/20 bg-slate-800/30">
          <form onSubmit={handleSend} className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              placeholder="Type your message..."
              className="flex-1 bg-slate-700/50 border border-indigo-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              disabled={isLoading}
              rows={1}
              style={{ maxHeight: "120px" }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim() && !isLoading) {
                    handleSend(e);
                  }
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 self-end"
            >
              {isLoading ? (
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
          </form>
        </div>
      </div>
    </div>
  );
}

