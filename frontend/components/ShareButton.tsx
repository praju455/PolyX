"use client";

import { useState } from "react";

export function ShareButton({ postId }: { postId: number }) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/post/${postId}` : `/post/${postId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="text-white/60 hover:text-indigo-400 p-2 rounded-lg hover:bg-white/5 transition-colors"
      title="Share"
      aria-label={copied ? "Link copied" : "Copy post link"}
    >
      {copied ? "✓" : "🔗"}
    </button>
  );
}
