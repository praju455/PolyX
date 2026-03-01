export type PostType = 0 | 1 | 2 | 3;

export interface Post {
  id: number;
  author: string;
  content: string;
  mediaCid: string;
  timestamp: number;
  postType: PostType;
  referenceId: number;
  likeCount: number;
  retweetCount: number;
  quoteCount: number;
  commentCount: number;
  version: number;
  deleted: boolean;
}

export interface Profile {
  handle: string;
  displayName: string;
  bio: string;
  avatarCid: string;
  headerCid: string;
  owner: string;
  createdAt: number;
}

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
    
    if (!res.ok) {
      // If response is not ok, try to get error message
      let errorMessage = `Request failed with status ${res.status}`;
      try {
        const errorJson = await res.json();
        errorMessage = errorJson.error || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
        errorMessage = res.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || "Request failed");
  }
  return json.data as T;
  } catch (error: any) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(
        `Cannot connect to backend server at ${BASE}. Please make sure the backend is running on port 3001.`
      );
    }
    throw error;
  }
}

export const api = {
  feed: (tag?: string) => request<Post[]>(tag ? `/api/feed?tag=${encodeURIComponent(tag)}` : "/api/feed"),
  post: (id: number) => request<Post>(`/api/post/${id}`),
  postsByAuthor: (author: string) => request<Post[]>(`/api/posts/by-author/${author}`),
  tweet: (user: string, text: string, mediaCid = "") =>
    request<{ txHash: string; postId?: number }>("/api/tweet", {
      method: "POST",
      body: JSON.stringify({ user, text, mediaCid }),
    }),
  like: (user: string, postId: number) =>
    request<{ txHash: string }>("/api/like", {
      method: "POST",
      body: JSON.stringify({ user, postId }),
    }),
  retweet: (user: string, postId: number) =>
    request<{ txHash: string; postId?: number }>("/api/retweet", {
      method: "POST",
      body: JSON.stringify({ user, postId }),
    }),
  quote: (user: string, postId: number, text: string, mediaCid = "") =>
    request<{ txHash: string; postId?: number }>("/api/quote", {
      method: "POST",
      body: JSON.stringify({ user, postId, text, mediaCid }),
    }),
  comment: (user: string, postId: number, text: string, mediaCid = "") =>
    request<{ txHash: string; postId?: number }>("/api/comment", {
      method: "POST",
      body: JSON.stringify({ user, postId, text, mediaCid }),
    }),
  edit: (user: string, postId: number, text: string, mediaCid = "") =>
    request<{ txHash: string }>("/api/edit", {
      method: "POST",
      body: JSON.stringify({ user, postId, text, mediaCid }),
    }),
  del: (user: string, postId: number) =>
    request<{ txHash: string }>("/api/delete", {
      method: "POST",
      body: JSON.stringify({ user, postId }),
    }),
  profileCreate: (data: {
    user: string;
    handle: string;
    displayName: string;
    bio?: string;
    avatarCid?: string;
    headerCid?: string;
  }) =>
    request<{ txHash: string }>("/api/profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  profileUpdate: (data: { user: string; displayName: string; bio?: string; avatarCid?: string; headerCid?: string }) =>
    request<{ txHash: string }>("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  profileByHandle: (handle: string) => request<Profile>(`/api/profile/handle/${handle}`),
  profileByOwner: (owner: string) => request<Profile>(`/api/profile/owner/${owner}`),
  handleAvailable: (handle: string) => request<{ available: boolean }>(`/api/handle/${handle}/available`),
  follow: (user: string, target: string) =>
    request<{ txHash: string }>("/api/follow", {
      method: "POST",
      body: JSON.stringify({ user, target }),
    }),
  unfollow: (user: string, target: string) =>
    request<{ txHash: string }>("/api/unfollow", {
      method: "POST",
      body: JSON.stringify({ user, target }),
    }),
  following: (user: string) => request<string[]>(`/api/following/${user}`),
  followers: (user: string) => request<string[]>(`/api/followers/${user}`),
  notifications: (user: string) => request<Array<{ type: "like" | "quote" | "comment" | "follow" | "mention"; from: string; postId?: number; timestamp: number }>>(`/api/notifications/${user}`),
  hasLiked: (postId: number, user: string) => request<{ liked: boolean }>(`/api/post/${postId}/liked/${user}`),
  hasRetweeted: (postId: number, user: string) => request<{ retweeted: boolean }>(`/api/post/${postId}/retweeted/${user}`),
  uploadToPinata: (filename: string, contentType: string, dataBase64: string) =>
    request<{ cid: string; url: string }>("/api/upload", {
      method: "POST",
      body: JSON.stringify({ filename, contentType, dataBase64 }),
    }),
  sendMessage: (from: string, to: string, content: string) =>
    request<ChatMessage>("/api/message/send", {
      method: "POST",
      body: JSON.stringify({ from, to, content }),
    }),
  deleteMessage: (messageId: string, user: string) =>
    request<{ deleted: boolean }>(`/api/message/${messageId}?user=${encodeURIComponent(user)}`, {
      method: "DELETE",
    }),
  conversations: (user: string) => request<Conversation[]>(`/api/conversations/${user}`),
  messages: (user: string, other: string) => request<ChatMessage[]>(`/api/messages/${user}/${other}`),
  clearChat: (user: string, other: string) =>
    request<{ cleared: boolean }>("/api/chat/clear", {
      method: "POST",
      body: JSON.stringify({ user, target: other }),
    }),
  blockUser: (user: string, target: string) =>
    request<{ blocked: boolean }>("/api/block", {
      method: "POST",
      body: JSON.stringify({ user, target }),
    }),
  unblockUser: (user: string, target: string) =>
    request<{ unblocked: boolean }>("/api/unblock", {
      method: "POST",
      body: JSON.stringify({ user, target }),
    }),
  isBlocked: (user: string, other: string) => request<{ blocked: boolean }>(`/api/blocked/${user}/${other}`),
  getBlockedUsers: (user: string) => request<string[]>(`/api/blocked/${user}`),
  search: (query: string) => request<Profile[]>(`/api/search?q=${encodeURIComponent(query)}`),
  searchPosts: (query: string) => request<Post[]>(`/api/search/posts?q=${encodeURIComponent(query)}`),
  trendingHashtags: () => request<Array<{ tag: string; count: number }>>("/api/hashtags/trending"),
  bookmark: (user: string, postId: number) =>
    request<{ bookmarked: boolean }>("/api/bookmark", {
      method: "POST",
      body: JSON.stringify({ user, postId }),
    }),
  unbookmark: (user: string, postId: number) =>
    request<{ bookmarked: boolean }>("/api/bookmark", {
      method: "DELETE",
      body: JSON.stringify({ user, postId }),
    }),
  bookmarks: (user: string) => request<Post[]>(`/api/bookmarks/${user}`),
  isBookmarked: (postId: number, user: string) => request<{ bookmarked: boolean }>(`/api/post/${postId}/bookmarked/${user}`),
  addReaction: (user: string, postId: number, reactionType: "fire" | "love" | "laugh") =>
    request<{ added: boolean }>("/api/reaction", {
      method: "POST",
      body: JSON.stringify({ user, postId, reactionType }),
    }),
  removeReaction: (user: string, postId: number) =>
    request<{ removed: boolean }>("/api/reaction", {
      method: "DELETE",
      body: JSON.stringify({ user, postId }),
    }),
  getReactions: (postId: number) => request<Record<string, number>>(`/api/post/${postId}/reactions`),
  getUserReaction: (postId: number, user: string) => request<{ reactionType: string | null }>(`/api/post/${postId}/reaction/${user}`),
  chatWithBot: (user: string, message: string) =>
    request<{ response: string }>("/api/chatbot/chat", {
      method: "POST",
      body: JSON.stringify({ user, message }),
    }),
  getChatbotHistory: (user: string) => request<Array<{ role: "user" | "assistant"; content: string; timestamp: number }>>(`/api/chatbot/history/${user}`),
  clearChatbotHistory: (user: string) =>
    request<{ cleared: boolean }>("/api/chatbot/clear", {
      method: "POST",
      body: JSON.stringify({ user }),
    }),
};

export interface ChatMessage {
  id?: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  deleted?: boolean;
  read?: number | null; // timestamp when read, null if not read
}

export interface Conversation {
  address: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}


