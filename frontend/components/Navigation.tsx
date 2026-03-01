"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ThemeToggle } from "./ThemeToggle";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/feed", label: "Feed" },
    { href: "/explore", label: "Explore" },
    { href: "/notifications", label: "Notifications" },
    { href: "/messaging", label: "Messages" },
    { href: "/about", label: "About" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/10 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:scale-105 transition-transform">
              PolyX
            </Link>
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pathname === item.href
                      ? "bg-indigo-500/20 text-indigo-300 shadow-lg"
                      : "opacity-70 hover:opacity-100 hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            <ConnectButton chainStatus="icon" showBalance={false} />
          </div>
        </div>
      </div>
    </nav>
  );
}

