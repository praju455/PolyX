import { MongoClient, Collection, ObjectId } from "mongodb";
import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/polyx"),
});

const parsed = envSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/polyx",
});

const client = new MongoClient(parsed.MONGODB_URI);
let db: ReturnType<MongoClient["db"]> | null = null;

export async function connectDb() {
  if (db) return db;
  await client.connect();
  db = client.db();
  await ensureIndexes(db);
  return db;
}

async function ensureIndexes(database: NonNullable<typeof db>) {
  const messages = database.collection("messages");
  await messages.createIndex({ from_address: 1, to_address: 1 });
  await messages.createIndex({ created_at: -1 });

  const blockedUsers = database.collection("blocked_users");
  await blockedUsers.createIndex(
    { blocker_address: 1, blocked_address: 1 },
    { unique: true }
  );

  const followers = database.collection("followers");
  await followers.createIndex(
    { follower_address: 1, following_address: 1 },
    { unique: true }
  );

  const bookmarks = database.collection("bookmarks");
  await bookmarks.createIndex(
    { user_address: 1, post_id: 1 },
    { unique: true }
  );

  const postsCache = database.collection("posts_cache");
  await postsCache.createIndex({ post_id: 1 }, { unique: true });
  await postsCache.createIndex({ content: "text" });
  await postsCache.createIndex({ hashtags: 1 });
  await postsCache.createIndex({ created_at: -1 });

  const reactions = database.collection("reactions");
  await reactions.createIndex(
    { user_address: 1, post_id: 1 },
    { unique: true }
  );

  const mentions = database.collection("mentions");
  await mentions.createIndex({ user_address: 1, post_id: 1, from_address: 1 });
}

export interface Message {
  id: string;
  from_address: string;
  to_address: string;
  content: string;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  read_at?: string | null;
}

export interface Conversation {
  address: string;
  last_message?: Message;
  unread_count: number;
}

export async function getConversations(userAddress: string): Promise<Conversation[]> {
  const database = await connectDb();
  const blockedData = await database.collection("blocked_users").find({}).toArray();
  const blockedAddresses = new Set<string>();
  if (blockedData) {
    blockedData.forEach((block: { blocker_address: string; blocked_address: string }) => {
      if (block.blocker_address.toLowerCase() === userAddress.toLowerCase()) {
        blockedAddresses.add(block.blocked_address.toLowerCase());
      }
      if (block.blocked_address.toLowerCase() === userAddress.toLowerCase()) {
        blockedAddresses.add(block.blocker_address.toLowerCase());
      }
    });
  }

  const data = await database
    .collection("messages")
    .find({ deleted: false })
    .sort({ created_at: -1 })
    .toArray();

  const userMessages = data.filter(
    (msg: { from_address: string; to_address: string }) => {
      const from = msg.from_address.toLowerCase();
      const to = msg.to_address.toLowerCase();
      const user = userAddress.toLowerCase();
      const other = from === user ? to : from;
      if (blockedAddresses.has(other)) return false;
      return from === user || to === user;
    }
  );

  const conversationsMap = new Map<string, Conversation>();
  for (const msg of userMessages) {
    const other =
      msg.from_address.toLowerCase() === userAddress.toLowerCase()
        ? msg.to_address
        : msg.from_address;
    const existing = conversationsMap.get(other.toLowerCase());
    const msgDate = new Date(msg.created_at).getTime();
    if (
      !existing ||
      !existing.last_message ||
      msgDate > new Date(existing.last_message.created_at).getTime()
    ) {
      conversationsMap.set(other.toLowerCase(), {
        address: other,
        last_message: msg,
        unread_count: 0,
      });
    }
  }

  return Array.from(conversationsMap.values()).sort((a, b) => {
    if (!a.last_message) return 1;
    if (!b.last_message) return -1;
    return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
  });
}

export async function getMessages(userAddress: string, otherAddress: string): Promise<Message[]> {
  const blocked = await isBlocked(userAddress, otherAddress);
  if (blocked) return [];

  const database = await connectDb();
  const data = await database
    .collection("messages")
    .find({
      $or: [
        {
          from_address: { $regex: new RegExp(`^${userAddress}$`, "i") },
          to_address: { $regex: new RegExp(`^${otherAddress}$`, "i") },
        },
        {
          from_address: { $regex: new RegExp(`^${otherAddress}$`, "i") },
          to_address: { $regex: new RegExp(`^${userAddress}$`, "i") },
        },
      ],
    })
    .sort({ created_at: 1 })
    .toArray();

  const conversationMessages = data.filter(
    (msg: { from_address: string; to_address: string }) =>
      (msg.from_address.toLowerCase() === userAddress.toLowerCase() &&
        msg.to_address.toLowerCase() === otherAddress.toLowerCase()) ||
      (msg.from_address.toLowerCase() === otherAddress.toLowerCase() &&
        msg.to_address.toLowerCase() === userAddress.toLowerCase())
  );

  const unreadMessages = conversationMessages.filter(
    (msg: { to_address: string; from_address: string; read_at?: string }) =>
      msg.to_address.toLowerCase() === userAddress.toLowerCase() &&
      msg.from_address.toLowerCase() !== userAddress.toLowerCase() &&
      !msg.read_at
  );

  if (unreadMessages.length > 0) {
    const messageIds = unreadMessages.map((m: { _id: ObjectId }) => m._id);
    await database.collection("messages").updateMany(
      { _id: { $in: messageIds } },
      { $set: { read_at: new Date().toISOString() } }
    );
  }

  return conversationMessages.map((m: { _id: ObjectId; [key: string]: unknown }) => ({
    id: m._id.toString(),
    from_address: m.from_address,
    to_address: m.to_address,
    content: m.content,
    created_at: m.created_at,
    updated_at: m.updated_at,
    deleted: m.deleted,
    read_at: m.read_at,
  }));
}

export async function sendMessage(fromAddress: string, toAddress: string, content: string): Promise<Message> {
  const database = await connectDb();
  const now = new Date().toISOString();
  const result = await database.collection("messages").insertOne({
    from_address: fromAddress,
    to_address: toAddress,
    content,
    created_at: now,
    updated_at: now,
    deleted: false,
  });
  return {
    id: result.insertedId.toString(),
    from_address: fromAddress,
    to_address: toAddress,
    content,
    created_at: now,
    updated_at: now,
    deleted: false,
  };
}

export async function deleteMessage(messageId: string, userAddress: string): Promise<boolean> {
  const database = await connectDb();
  const message = await database.collection("messages").findOne({ _id: new ObjectId(messageId) });
  if (!message) throw new Error("Message not found");
  if (message.from_address.toLowerCase() !== userAddress.toLowerCase()) {
    throw new Error("Unauthorized: You can only delete your own messages");
  }
  await database.collection("messages").updateOne(
    { _id: new ObjectId(messageId) },
    { $set: { deleted: true, content: "This message was deleted" } }
  );
  return true;
}

export async function clearChat(userAddress: string, otherAddress: string): Promise<boolean> {
  const database = await connectDb();
  await database.collection("messages").updateMany(
    {
      $or: [
        { from_address: userAddress, to_address: otherAddress },
        { from_address: otherAddress, to_address: userAddress },
      ],
    },
    { $set: { deleted: true, content: "This message was deleted" } }
  );
  return true;
}

export async function blockUser(blockerAddress: string, blockedAddress: string): Promise<boolean> {
  if (!blockerAddress || !blockedAddress) throw new Error("Invalid addresses");
  if (blockerAddress.toLowerCase() === blockedAddress.toLowerCase()) {
    throw new Error("Cannot block yourself");
  }
  if (blockerAddress.length !== 42 || !blockerAddress.startsWith("0x")) {
    throw new Error("Invalid blocker address format");
  }
  if (blockedAddress.length !== 42 || !blockedAddress.startsWith("0x")) {
    throw new Error("Invalid blocked address format");
  }

  const database = await connectDb();
  try {
    await database.collection("blocked_users").insertOne({
      blocker_address: blockerAddress.toLowerCase(),
      blocked_address: blockedAddress.toLowerCase(),
      created_at: new Date(),
    });
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) return true;
    throw err;
  }
  return true;
}

export async function unblockUser(blockerAddress: string, blockedAddress: string): Promise<boolean> {
  if (!blockerAddress || !blockedAddress) throw new Error("Invalid addresses");
  if (blockerAddress.length !== 42 || !blockerAddress.startsWith("0x")) {
    throw new Error("Invalid blocker address format");
  }
  if (blockedAddress.length !== 42 || !blockedAddress.startsWith("0x")) {
    throw new Error("Invalid blocked address format");
  }

  const database = await connectDb();
  await database.collection("blocked_users").deleteOne({
    blocker_address: blockerAddress.toLowerCase(),
    blocked_address: blockedAddress.toLowerCase(),
  });
  return true;
}

export async function getBlockedUsers(userAddress: string): Promise<string[]> {
  const database = await connectDb();
  const data = await database
    .collection("blocked_users")
    .find({ blocker_address: userAddress.toLowerCase() })
    .toArray();
  return data.map((b: { blocked_address: string }) => b.blocked_address.toLowerCase());
}

export async function isBlocked(userAddress: string, otherAddress: string): Promise<boolean> {
  const database = await connectDb();
  const data = await database.collection("blocked_users").find({}).toArray();
  return data.some(
    (block: { blocker_address: string; blocked_address: string }) =>
      (block.blocker_address.toLowerCase() === userAddress.toLowerCase() &&
        block.blocked_address.toLowerCase() === otherAddress.toLowerCase()) ||
      (block.blocker_address.toLowerCase() === otherAddress.toLowerCase() &&
        block.blocked_address.toLowerCase() === userAddress.toLowerCase())
  );
}

// Followers
export async function syncFollowToMongo(followerAddress: string, followingAddress: string): Promise<void> {
  const database = await connectDb();
  await database.collection("followers").updateOne(
    {
      follower_address: followerAddress.toLowerCase(),
      following_address: followingAddress.toLowerCase(),
    },
    {
      $set: {
        follower_address: followerAddress.toLowerCase(),
        following_address: followingAddress.toLowerCase(),
        created_at: new Date(),
      },
    },
    { upsert: true }
  );
}

export async function syncUnfollowFromMongo(followerAddress: string, followingAddress: string): Promise<void> {
  const database = await connectDb();
  await database.collection("followers").deleteOne({
    follower_address: followerAddress.toLowerCase(),
    following_address: followingAddress.toLowerCase(),
  });
}

export async function getFollowersFromMongo(userAddress: string): Promise<string[]> {
  const database = await connectDb();
  const data = await database
    .collection("followers")
    .find({ following_address: userAddress.toLowerCase() })
    .toArray();
  return data.map((r: { follower_address: string }) => r.follower_address);
}

export async function getFollowingFromMongo(userAddress: string): Promise<string[]> {
  const database = await connectDb();
  const data = await database
    .collection("followers")
    .find({ follower_address: userAddress.toLowerCase() })
    .toArray();
  return data.map((r: { following_address: string }) => r.following_address);
}

// Bookmarks
export async function addBookmark(userAddress: string, postId: number): Promise<boolean> {
  const database = await connectDb();
  try {
    await database.collection("bookmarks").updateOne(
      { user_address: userAddress.toLowerCase(), post_id: postId },
      { $set: { user_address: userAddress.toLowerCase(), post_id: postId, created_at: new Date() } },
      { upsert: true }
    );
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) return true;
    throw err;
  }
  return true;
}

export async function removeBookmark(userAddress: string, postId: number): Promise<boolean> {
  const database = await connectDb();
  await database.collection("bookmarks").deleteOne({
    user_address: userAddress.toLowerCase(),
    post_id: postId,
  });
  return true;
}

export async function getBookmarks(userAddress: string): Promise<number[]> {
  const database = await connectDb();
  const data = await database
    .collection("bookmarks")
    .find({ user_address: userAddress.toLowerCase() })
    .sort({ created_at: -1 })
    .toArray();
  return data.map((b: { post_id: number }) => b.post_id);
}

export async function isBookmarked(userAddress: string, postId: number): Promise<boolean> {
  const database = await connectDb();
  const doc = await database.collection("bookmarks").findOne({
    user_address: userAddress.toLowerCase(),
    post_id: postId,
  });
  return !!doc;
}

// Posts cache (for hashtags, search)
export function extractHashtags(content: string): string[] {
  const matches = content.match(/#(\w+)/g) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

export function extractMentions(content: string): string[] {
  const matches = content.match(/@(\w+)/g) || [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

export async function upsertPostCache(
  postId: number,
  author: string,
  content: string,
  postType: number,
  referenceId: number,
  timestamp: number
): Promise<void> {
  const hashtags = extractHashtags(content);
  const database = await connectDb();
  await database.collection("posts_cache").updateOne(
    { post_id: postId },
    {
      $set: {
        post_id: postId,
        author: author.toLowerCase(),
        content,
        hashtags,
        post_type: postType,
        reference_id: referenceId,
        created_at: timestamp,
      },
    },
    { upsert: true }
  );
}

export async function getPostIdsByHashtag(tag: string): Promise<number[]> {
  const database = await connectDb();
  const data = await database
    .collection("posts_cache")
    .find({ hashtags: tag.toLowerCase() })
    .sort({ created_at: -1 })
    .toArray();
  return data.map((p: { post_id: number }) => p.post_id);
}

export async function searchPosts(query: string): Promise<number[]> {
  const database = await connectDb();
  try {
    const data = await database
      .collection("posts_cache")
      .find({ $text: { $search: query } })
      .sort({ score: { $meta: "textScore" } })
      .limit(50)
      .toArray();
    return data.map((p: { post_id: number }) => p.post_id);
  } catch {
    // Fallback to regex if text index not ready
    const data = await database
      .collection("posts_cache")
      .find({ content: { $regex: query, $options: "i" } })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();
    return data.map((p: { post_id: number }) => p.post_id);
  }
}

export async function getTrendingHashtags(limit = 10): Promise<{ tag: string; count: number }[]> {
  const database = await connectDb();
  const oneDayAgo = Date.now() / 1000 - 86400;
  const data = await database
    .collection("posts_cache")
    .aggregate([
      { $match: { created_at: { $gte: oneDayAgo } } },
      { $unwind: "$hashtags" },
      { $group: { _id: "$hashtags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { tag: "$_id", count: 1, _id: 0 } },
    ])
    .toArray();
  return data;
}

// Mentions (for notifications)
export async function addMentionNotification(
  userAddress: string,
  fromAddress: string,
  postId: number,
  timestamp: number
): Promise<void> {
  const database = await connectDb();
  await database.collection("mentions").insertOne({
    user_address: userAddress.toLowerCase(),
    from_address: fromAddress.toLowerCase(),
    post_id: postId,
    timestamp,
    created_at: new Date(),
  });
}

export async function getMentionNotifications(userAddress: string): Promise<Array<{ from: string; postId: number; timestamp: number }>> {
  const database = await connectDb();
  const data = await database
    .collection("mentions")
    .find({ user_address: userAddress.toLowerCase() })
    .sort({ timestamp: -1 })
    .limit(50)
    .toArray();
  return data.map((m: { from_address: string; post_id: number; timestamp: number }) => ({
    from: m.from_address,
    postId: m.post_id,
    timestamp: m.timestamp,
  }));
}

// Reactions
export async function addReaction(
  userAddress: string,
  postId: number,
  reactionType: string
): Promise<boolean> {
  const database = await connectDb();
  try {
    await database.collection("reactions").updateOne(
      { user_address: userAddress.toLowerCase(), post_id: postId },
      {
        $set: {
          user_address: userAddress.toLowerCase(),
          post_id: postId,
          reaction_type: reactionType,
          created_at: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) return true;
    throw err;
  }
  return true;
}

export async function removeReaction(userAddress: string, postId: number): Promise<boolean> {
  const database = await connectDb();
  await database.collection("reactions").deleteOne({
    user_address: userAddress.toLowerCase(),
    post_id: postId,
  });
  return true;
}

export async function getReactions(postId: number): Promise<{ [type: string]: number }> {
  const database = await connectDb();
  const data = await database.collection("reactions").find({ post_id: postId }).toArray();
  const counts: { [type: string]: number } = {};
  for (const r of data) {
    counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1;
  }
  return counts;
}

export async function getUserReaction(userAddress: string, postId: number): Promise<string | null> {
  const database = await connectDb();
  const doc = await database.collection("reactions").findOne({
    user_address: userAddress.toLowerCase(),
    post_id: postId,
  });
  return doc?.reaction_type || null;
}
