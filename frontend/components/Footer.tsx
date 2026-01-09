"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-auto w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
              PolyX
            </h3>
            <p className="opacity-70 text-sm">
              Gasless, on-chain social network on Polygon Amoy. Your social graph, your data, your control.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <Link href="/" className="hover:text-indigo-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:text-indigo-400 transition-colors">
                  Feed
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-indigo-400 transition-colors">
                  Explore
                </Link>
              </li>
              <li>
                <Link href="/notifications" className="hover:text-indigo-400 transition-colors">
                  Notifications
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Account</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <Link href="/settings" className="hover:text-indigo-400 transition-colors">
                  Settings
                </Link>
              </li>
              <li>
                <Link href="/messaging" className="hover:text-indigo-400 transition-colors">
                  Messages
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-sm opacity-70">
              <li>
                <a href="https://github.com/polyx" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://twitter.com/polyx" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://discord.gg/polyx" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm opacity-60">
          <p>© 2026 PolyX. Built on Polygon Amoy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


