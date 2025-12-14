"use client";

import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Feed } from "../components/Feed";
import { Composer } from "../components/Composer";
import { OnboardingGate } from "../components/OnboardingGate";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import ExplorePage from "./explore/page";
import NotificationsPage from "./notifications/page";
import MessagingPage from "./messaging/page";
import SettingsPage from "./settings/page";

const features = [
  {
    icon: "🔐",
    title: "Wallet-First Identity",
    description: "Connect with any Web3 wallet. Your profile is unique per wallet address.",
  },
  {
    icon: "⚡",
    title: "Gasless Transactions",
    description: "All on-chain actions are sponsored. Post, like, and interact without paying gas fees.",
  },
  {
    icon: "🖼️",
    title: "IPFS Media Storage",
    description: "Images and files are stored on IPFS/Pinata with on-chain verification.",
  },
  {
    icon: "🔗",
    title: "On-Chain Social Graph",
    description: "Follow, like, retweet, quote, and comment - all recorded on Polygon Amoy.",
  },
  {
    icon: "💬",
    title: "WhatsApp-Style Messaging",
    description: "Real-time messaging with read receipts (blue ticks), message deletion, multi-select, and user blocking.",
  },
  {
    icon: "🔔",
    title: "Notifications",
    description: "Get notified when someone likes, comments, quotes, or follows you.",
  },
  {
    icon: "✨",
    title: "Modern 3D UI/UX",
    description: "Beautiful, responsive interface with 3D effects, glassmorphism, and smooth animations.",
  },
  {
    icon: "🌐",
    title: "Decentralized & Transparent",
    description: "All actions are verifiable on-chain. No central authority controls your content.",
  },
  {
    icon: "🔒",
    title: "Privacy & Control",
    description: "Block users, clear chats, delete messages, and control your social experience.",
  },
  {
    icon: "📱",
    title: "Message Management",
    description: "Delete messages for yourself or everyone, clear entire conversations, and multi-select messages.",
  },
];

export default function Home() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<"features" | "about">("features");
  const [loggedInTab, setLoggedInTab] = useState<"feed" | "explore" | "notifications" | "messages" | "settings">("feed");
  const [feedMode, setFeedMode] = useState<"all" | "following">("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: blocked = [] } = useQuery<string[]>({
    queryKey: ["blocked", address],
    queryFn: () => (address ? api.getBlockedUsers(address) : Promise.resolve([])),
    enabled: !!address && isConnected && mounted,
    refetchInterval: 30_000,
  });

  // Show loading state until mounted to prevent hydration mismatch
  if (!mounted) {
  return (
      <main className="min-h-screen">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
            <div className="text-center space-y-8">
              <div className="space-y-4">
                <p className="text-sm uppercase tracking-[0.2em] text-indigo-300/80 font-medium">Polygon Amoy Testnet</p>
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  PolyX
                </h1>
                <p className="text-2xl md:text-3xl text-white/90 font-light max-w-3xl mx-auto">
                  Gasless, On-Chain Social Network
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  // If logged in, show the app interface with Home and About Us tabs
  if (isConnected && address) {
    return (
      <main className="min-h-screen">
        <OnboardingGate>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Tabs - Home and About Us at the top */}
            <section className="py-4">
              <div className="card-3d p-2 flex gap-2 justify-center">
                <button
                  onClick={() => setTab("features")}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    tab === "features"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Home
                </button>
                <button
                  onClick={() => setTab("about")}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    tab === "about"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  About Us
                </button>
              </div>
            </section>

            {/* Content based on tab */}
            {tab === "features" && (
              <div className="space-y-6">
                <Composer />
                {/* Feed Mode Toggle */}
                <div className="card-3d p-2 flex gap-2">
                  <button
                    onClick={() => setFeedMode("all")}
                    className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all ${
                      feedMode === "all"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    All Posts
                  </button>
                  <button
                    onClick={() => setFeedMode("following")}
                    className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-all ${
                      feedMode === "following"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Following
                  </button>
                </div>
                <Feed mode={feedMode} blocked={blocked} />
              </div>
            )}
            {tab === "about" && (
              <section className="py-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-4 mb-12">
                    <h2 className="text-4xl md:text-5xl font-bold gradient-text">About PolyX</h2>
                    <p className="text-xl text-white/70 max-w-3xl mx-auto">
                      A revolutionary decentralized social network built on Polygon
                    </p>
                  </div>

                  <div className="card-3d p-8 md:p-12 space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold gradient-text">Our Mission</h3>
                      <p className="text-white/80 leading-relaxed text-lg">
                        PolyX is designed to bring true decentralization to social media. We believe that users should own their data, 
                        control their social graph, and interact without barriers. By leveraging Polygon's low-cost infrastructure and 
                        our gasless transaction system, we make on-chain social networking accessible to everyone.
                      </p>
                      <p className="text-white/70 leading-relaxed">
                        Unlike traditional social media platforms, PolyX puts you in complete control. Your content, your connections, 
                        and your digital identity are truly yours. We're building a future where social networking is transparent, 
                        verifiable, and free from centralized control.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold gradient-text">What Makes Us Different</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                          <h4 className="text-lg font-semibold text-indigo-300">🔐 True Ownership</h4>
                          <p className="text-white/70">
                            Your profile, posts, and social connections are stored on-chain. You truly own your digital identity. 
                            No platform can delete your content or ban your account without your consent.
                          </p>
                        </div>
                        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                          <h4 className="text-lg font-semibold text-indigo-300">⚡ Zero Gas Fees</h4>
                          <p className="text-white/70">
                            All transactions are sponsored, so you can post, like, and interact without paying any gas fees. 
                            This removes the biggest barrier to on-chain social networking.
                          </p>
                        </div>
                        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                          <h4 className="text-lg font-semibold text-indigo-300">🌐 Decentralized Storage</h4>
                          <p className="text-white/70">
                            Media files are stored on IPFS, ensuring your content is distributed and resilient. Your images and 
                            videos are not stored on a single server that can go down.
                          </p>
                        </div>
                        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                          <h4 className="text-lg font-semibold text-indigo-300">🔒 Privacy First</h4>
                          <p className="text-white/70">
                            Block users, control your messaging, and manage your social experience with full privacy controls. 
                            You decide who can interact with you and how.
                          </p>
                        </div>
                        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                          <h4 className="text-lg font-semibold text-indigo-300">💬 WhatsApp-Style Messaging</h4>
                          <p className="text-white/70">
                            Real-time messaging with read receipts, message deletion, multi-select, and user blocking. Experience 
                            familiar messaging features in a decentralized environment.
                          </p>
                        </div>
                        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                          <h4 className="text-lg font-semibold text-indigo-300">✨ Modern 3D UI/UX</h4>
                          <p className="text-white/70">
                            Beautiful, responsive interface with 3D effects, glassmorphism, and smooth animations. Experience 
                            the future of web design while using decentralized technology.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold gradient-text">Technology Stack</h3>
                      <p className="text-white/70 mb-4">
                        PolyX is built with cutting-edge Web3 technologies to provide a seamless, secure, and scalable experience:
                      </p>
                      <div className="flex flex-wrap gap-3">
                        {["Polygon Amoy", "IPFS/Pinata", "Next.js", "TypeScript", "Supabase", "RainbowKit", "Wagmi", "Ethers.js", "Framer Motion"].map((tech) => (
                          <span
                            key={tech}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-sm font-medium hover:scale-105 transition-transform"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold gradient-text">Complete Feature Set</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="text-lg font-semibold text-indigo-300">Social Features</h4>
                          <ul className="space-y-2 text-white/80">
                            <li className="flex items-start gap-3">
                              <span className="text-indigo-400 mt-1">✓</span>
                              <span><strong>Posts:</strong> Create, edit, and delete posts with text and media support</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-indigo-400 mt-1">✓</span>
                              <span><strong>Interactions:</strong> Like, retweet, quote, and comment on any post</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-indigo-400 mt-1">✓</span>
                              <span><strong>Social Graph:</strong> Follow/unfollow users, view followers and following lists</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-indigo-400 mt-1">✓</span>
                              <span><strong>Profiles:</strong> Customizable profiles with avatars, banners, and bios</span>
                            </li>
                          </ul>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-lg font-semibold text-indigo-300">Messaging Features</h4>
                          <ul className="space-y-2 text-white/80">
                            <li className="flex items-start gap-3">
                              <span className="text-indigo-400 mt-1">✓</span>
                              <span><strong>Real-Time Chat:</strong> Send and receive messages instantly</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-indigo-400 mt-1">✓</span>
                              <span><strong>Read Receipts:</strong> See when your messages have been read (blue ticks)</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-indigo-400 mt-1">✓</span>
                              <span><strong>Message Deletion:</strong> Delete messages for yourself or everyone</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-indigo-400 mt-1">✓</span>
                              <span><strong>Multi-Select:</strong> Select multiple messages for bulk actions</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-indigo-400 mt-1">✓</span>
                              <span><strong>User Blocking:</strong> Block users from messaging and seeing your content</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <span className="text-indigo-400 mt-1">✓</span>
                              <span><strong>Clear Chat:</strong> Clear entire conversations with one click</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold gradient-text">Why Choose PolyX?</h3>
                      <div className="space-y-4 text-white/80">
                        <p>
                          <strong className="text-indigo-300">Censorship Resistance:</strong> Your content lives on the blockchain. 
                          No single entity can remove it or silence your voice. This is especially important for free speech and 
                          protecting against platform manipulation.
                        </p>
                        <p>
                          <strong className="text-indigo-300">Data Portability:</strong> Since everything is on-chain, you can 
                          take your social graph and content with you. Your followers, posts, and interactions are yours forever, 
                          regardless of what happens to PolyX.
                        </p>
                        <p>
                          <strong className="text-indigo-300">Transparency:</strong> All interactions are verifiable on-chain. 
                          You can verify likes, follows, and posts through blockchain explorers. No hidden algorithms or shadow 
                          banning.
                        </p>
                        <p>
                          <strong className="text-indigo-300">Community Driven:</strong> PolyX is built for the community, by the 
                          community. We're creating a platform where users have real control and ownership over their social experience.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </section>
            )}
          </div>
        </OnboardingGate>
      </main>
    );
  }

  // If not logged in, show landing page with tabs
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-300/80 font-medium">Polygon Amoy Testnet</p>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                PolyX
              </h1>
              <p className="text-2xl md:text-3xl text-white/90 font-light max-w-3xl mx-auto">
                Gasless, On-Chain Social Network
              </p>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Post, like, retweet, and interact on-chain without paying gas. Your social graph, your data, your control.
              </p>
        </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/"
                className="btn-3d px-8 py-4"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabs - At the top */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card-3d p-2 flex gap-2 justify-center">
          <button
            onClick={() => setTab("features")}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              tab === "features"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setTab("about")}
            className={`px-8 py-3 rounded-xl font-semibold transition-all ${
              tab === "about"
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            About Us
          </button>
        </div>
      </section>

      {/* Features Tab */}
      {tab === "features" && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4 mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold gradient-text">Features</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Everything you need for a decentralized social experience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card-3d p-6 space-y-4 group hover:scale-105 transition-transform"
              >
                <div className="text-4xl">{feature.icon}</div>
                <h3 className="text-xl font-semibold group-hover:text-indigo-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* About Us Tab */}
      {tab === "about" && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-4xl md:text-5xl font-bold gradient-text">About PolyX</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                A revolutionary decentralized social network built on Polygon
              </p>
            </div>

            <div className="card-3d p-8 md:p-12 space-y-8">
              <div className="space-y-4">
                <h3 className="text-2xl font-bold gradient-text">Our Mission</h3>
                <p className="text-white/80 leading-relaxed text-lg">
                  PolyX is designed to bring true decentralization to social media. We believe that users should own their data, 
                  control their social graph, and interact without barriers. By leveraging Polygon's low-cost infrastructure and 
                  our gasless transaction system, we make on-chain social networking accessible to everyone.
                </p>
                <p className="text-white/70 leading-relaxed">
                  Unlike traditional social media platforms, PolyX puts you in complete control. Your content, your connections, 
                  and your digital identity are truly yours. We're building a future where social networking is transparent, 
                  verifiable, and free from centralized control.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold gradient-text">What Makes Us Different</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <h4 className="text-lg font-semibold text-indigo-300">🔐 True Ownership</h4>
                    <p className="text-white/70">
                      Your profile, posts, and social connections are stored on-chain. You truly own your digital identity. 
                      No platform can delete your content or ban your account without your consent.
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <h4 className="text-lg font-semibold text-indigo-300">⚡ Zero Gas Fees</h4>
                    <p className="text-white/70">
                      All transactions are sponsored, so you can post, like, and interact without paying any gas fees. 
                      This removes the biggest barrier to on-chain social networking.
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <h4 className="text-lg font-semibold text-indigo-300">🌐 Decentralized Storage</h4>
                    <p className="text-white/70">
                      Media files are stored on IPFS, ensuring your content is distributed and resilient. Your images and 
                      videos are not stored on a single server that can go down.
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <h4 className="text-lg font-semibold text-indigo-300">🔒 Privacy First</h4>
                    <p className="text-white/70">
                      Block users, control your messaging, and manage your social experience with full privacy controls. 
                      You decide who can interact with you and how.
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <h4 className="text-lg font-semibold text-indigo-300">💬 WhatsApp-Style Messaging</h4>
                    <p className="text-white/70">
                      Real-time messaging with read receipts, message deletion, multi-select, and user blocking. Experience 
                      familiar messaging features in a decentralized environment.
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <h4 className="text-lg font-semibold text-indigo-300">✨ Modern 3D UI/UX</h4>
                    <p className="text-white/70">
                      Beautiful, responsive interface with 3D effects, glassmorphism, and smooth animations. Experience 
                      the future of web design while using decentralized technology.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold gradient-text">Technology Stack</h3>
                <p className="text-white/70 mb-4">
                  PolyX is built with cutting-edge Web3 technologies to provide a seamless, secure, and scalable experience:
                </p>
                <div className="flex flex-wrap gap-3">
                  {["Polygon Amoy", "IPFS/Pinata", "Next.js", "TypeScript", "Supabase", "RainbowKit", "Wagmi", "Ethers.js", "Framer Motion"].map((tech) => (
                    <span
                      key={tech}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl text-sm font-medium hover:scale-105 transition-transform"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold gradient-text">Complete Feature Set</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-indigo-300">Social Features</h4>
                    <ul className="space-y-2 text-white/80">
                      <li className="flex items-start gap-3">
                        <span className="text-indigo-400 mt-1">✓</span>
                        <span><strong>Posts:</strong> Create, edit, and delete posts with text and media support</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-indigo-400 mt-1">✓</span>
                        <span><strong>Interactions:</strong> Like, retweet, quote, and comment on any post</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-indigo-400 mt-1">✓</span>
                        <span><strong>Social Graph:</strong> Follow/unfollow users, view followers and following lists</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-indigo-400 mt-1">✓</span>
                        <span><strong>Profiles:</strong> Customizable profiles with avatars, banners, and bios</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-indigo-300">Messaging Features</h4>
                    <ul className="space-y-2 text-white/80">
                      <li className="flex items-start gap-3">
                        <span className="text-indigo-400 mt-1">✓</span>
                        <span><strong>Real-Time Chat:</strong> Send and receive messages instantly</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-indigo-400 mt-1">✓</span>
                        <span><strong>Read Receipts:</strong> See when your messages have been read (blue ticks)</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-indigo-400 mt-1">✓</span>
                        <span><strong>Message Deletion:</strong> Delete messages for yourself or everyone</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-indigo-400 mt-1">✓</span>
                        <span><strong>Multi-Select:</strong> Select multiple messages for bulk actions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-indigo-400 mt-1">✓</span>
                        <span><strong>User Blocking:</strong> Block users from messaging and seeing your content</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-indigo-400 mt-1">✓</span>
                        <span><strong>Clear Chat:</strong> Clear entire conversations with one click</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold gradient-text">Why Choose PolyX?</h3>
                <div className="space-y-4 text-white/80">
                  <p>
                    <strong className="text-indigo-300">Censorship Resistance:</strong> Your content lives on the blockchain. 
                    No single entity can remove it or silence your voice. This is especially important for free speech and 
                    protecting against platform manipulation.
                  </p>
                  <p>
                    <strong className="text-indigo-300">Data Portability:</strong> Since everything is on-chain, you can 
                    take your social graph and content with you. Your followers, posts, and interactions are yours forever, 
                    regardless of what happens to PolyX.
                  </p>
                  <p>
                    <strong className="text-indigo-300">Transparency:</strong> All interactions are verifiable on-chain. 
                    You can verify likes, follows, and posts through blockchain explorers. No hidden algorithms or shadow 
                    banning.
                  </p>
                  <p>
                    <strong className="text-indigo-300">Community Driven:</strong> PolyX is built for the community, by the 
                    community. We're creating a platform where users have real control and ownership over their social experience.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-indigo-500/20">
                <h3 className="text-2xl font-bold gradient-text">Get Started</h3>
                <p className="text-white/80 mb-4">
                  Ready to join the decentralized social revolution? Connect your wallet and start building your on-chain 
                  social presence today. No gas fees, no barriers, just pure Web3 social networking.
                </p>
                <p className="text-white/70 text-sm mb-4">
                  <strong>Note:</strong> PolyX is currently running on Polygon Amoy testnet. Make sure you have testnet ETH 
                  in your wallet to interact with the platform. All transactions are sponsored, so you won't pay gas fees, 
                  but you need a wallet connection.
                </p>
                <Link
                  href="/"
                  className="btn-3d inline-block mt-4"
                >
                  Start Using PolyX
                </Link>
          </div>
        </div>
          </motion.div>
        </section>
      )}

      {/* CTA Section */}
      {tab === "features" && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card-3d p-12 md:p-16 text-center space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-bold gradient-text">Ready to Get Started?</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Connect your wallet and start building your on-chain social presence today.
            </p>
            <Link
              href="/feed"
              className="btn-3d inline-block"
            >
              Go to Feed
            </Link>
          </motion.div>
        </section>
      )}
    </main>
  );
}
