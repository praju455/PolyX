"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all"
      >
        {isMobileOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-40
          bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
          border-r border-indigo-500/20
          backdrop-blur-xl
          shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                P
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                PolyX
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            <Link
              href="/"
              onClick={() => setIsMobileOpen(false)}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-xl
                transition-all duration-200
                group relative overflow-hidden
                ${
                  pathname === "/"
                    ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white shadow-lg shadow-indigo-500/20"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }
              `}
            >
              {/* Active indicator */}
              {pathname === "/" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full" />
              )}
              <span className="text-xl">🏠</span>
              <span className="font-medium">Home</span>
              {pathname === "/" && (
                <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </Link>
            {mounted && isConnected && (
              <>
                <Link
                  href="/"
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    group relative overflow-hidden
                    ${
                      pathname === "/" && isConnected
                        ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white shadow-lg shadow-indigo-500/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  {pathname === "/feed" && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full" />
                  )}
                  <span className="text-xl">📰</span>
                  <span className="font-medium">Feed</span>
                  {pathname === "/feed" && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </Link>
                <Link
                  href="/explore"
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    group relative overflow-hidden
                    ${
                      pathname === "/explore"
                        ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white shadow-lg shadow-indigo-500/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  {pathname === "/explore" && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full" />
                  )}
                  <span className="text-xl">🔍</span>
                  <span className="font-medium">Explore</span>
                  {pathname === "/explore" && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </Link>
                <Link
                  href="/messaging"
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    group relative overflow-hidden
                    ${
                      pathname === "/messaging" || pathname === "/messages"
                        ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white shadow-lg shadow-indigo-500/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  {(pathname === "/messaging" || pathname === "/messages") && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full" />
                  )}
                  <span className="text-xl">💬</span>
                  <span className="font-medium">Messages</span>
                  {(pathname === "/messaging" || pathname === "/messages") && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </Link>
                <Link
                  href="/chatbot"
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    group relative overflow-hidden
                    ${
                      pathname === "/chatbot"
                        ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white shadow-lg shadow-indigo-500/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  {pathname === "/chatbot" && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full" />
                  )}
                  <span className="text-xl">🤖</span>
                  <span className="font-medium">Chatbot</span>
                  {pathname === "/chatbot" && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center space-x-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    group relative overflow-hidden
                    ${
                      pathname === "/settings"
                        ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white shadow-lg shadow-indigo-500/20"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }
                  `}
                >
                  {pathname === "/settings" && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-purple-400 rounded-r-full" />
                  )}
                  <span className="text-xl">⚙️</span>
                  <span className="font-medium">Settings</span>
                  {pathname === "/settings" && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  )}
                </Link>
              </>
            )}
          </nav>

          {/* Wallet Connection */}
          {mounted && (
            <div className="mt-6 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
              {isConnected ? (
                <ConnectButton chainStatus="icon" showBalance={false} />
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-2">Connect Wallet</p>
                  <ConnectButton chainStatus="icon" showBalance={false} />
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}


