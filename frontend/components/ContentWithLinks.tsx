"use client";

import Link from "next/link";

interface Props {
  content: string;
  className?: string;
  highlightBot?: boolean;
}

export function ContentWithLinks({ content, className = "", highlightBot = true }: Props) {
  // Split by #hashtag, @mention, and @PolyXBot
  const parts: { type: "text" | "hashtag" | "mention"; value: string }[] = [];
  const regex = /(#[a-zA-Z0-9_]+|@[a-zA-Z0-9_]+)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    const val = match[0];
    if (val.startsWith("#")) {
      parts.push({ type: "hashtag", value: val.slice(1) });
    } else {
      parts.push({ type: "mention", value: val.slice(1) });
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.slice(lastIndex) });
  }

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (part.type === "hashtag") {
          return (
            <Link
              key={idx}
              href={`/explore?tag=${encodeURIComponent(part.value)}`}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              #{part.value}
            </Link>
          );
        }
        if (part.type === "mention") {
          const isBot = /^polyxbot$/i.test(part.value);
          return (
            <Link
              key={idx}
              href={isBot ? "/chatbot" : `/search?q=${encodeURIComponent(part.value)}`}
              className={highlightBot && isBot ? "text-indigo-400 font-semibold" : "text-indigo-400 hover:text-indigo-300"}
            >
              @{part.value}
            </Link>
          );
        }
        return <span key={idx}>{part.value}</span>;
      })}
    </span>
  );
}
