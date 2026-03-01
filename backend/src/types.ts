export type PostType = 0 | 1 | 2 | 3; // Original, Retweet, Quote, Comment

export const PostTypeEnum = {
  Original: 0 as PostType,
  Retweet: 1 as PostType,
  Quote: 2 as PostType,
  Comment: 3 as PostType,
} as const;

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

export interface ChatMessage {
  from: string;
  to: string;
  cid: string;
  cidHash: string;
  timestamp: number;
}

export interface Conversation {
  address: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}


