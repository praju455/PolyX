import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(10),
});

const parsed = envSchema.parse({
  SUPABASE_URL: process.env.SUPABASE_URL || "https://olbfqjmzbikucmqqesdf.supabase.co",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYmZxam16YmlrdWNtcXFlc2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMTM1MzUsImV4cCI6MjA4MDU4OTUzNX0.0V3Ts46X84hUMde8peUWm-hj0OAhF6k5u2QW6crMCrs",
});

export const supabase = createClient(parsed.SUPABASE_URL, parsed.SUPABASE_ANON_KEY);

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

// Get all conversations for a user
export async function getConversations(userAddress: string): Promise<Conversation[]> {
  // First, get all blocked users
  const { data: blockedData } = await supabase
    .from("blocked_users")
    .select("*");

  const blockedAddresses = new Set<string>();
  if (blockedData) {
    blockedData.forEach((block) => {
      if (block.blocker_address.toLowerCase() === userAddress.toLowerCase()) {
        blockedAddresses.add(block.blocked_address.toLowerCase());
      }
      if (block.blocked_address.toLowerCase() === userAddress.toLowerCase()) {
        blockedAddresses.add(block.blocker_address.toLowerCase());
      }
    });
  }

  // Fetch messages where user is sender or receiver
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Filter messages where user is involved and not blocked
  const userMessages = data.filter(
    (msg) => {
      const from = msg.from_address.toLowerCase();
      const to = msg.to_address.toLowerCase();
      const user = userAddress.toLowerCase();
      
      // Check if conversation partner is blocked
      const other = from === user ? to : from;
      if (blockedAddresses.has(other)) {
        return false;
      }
      
      return from === user || to === user;
    }
  );

  // Group messages by conversation partner
  const conversationsMap = new Map<string, Conversation>();

  for (const msg of userMessages) {
    const other = msg.from_address.toLowerCase() === userAddress.toLowerCase() ? msg.to_address : msg.from_address;
    const existing = conversationsMap.get(other.toLowerCase());

    if (!existing || !existing.last_message || new Date(msg.created_at) > new Date(existing.last_message.created_at)) {
      conversationsMap.set(other.toLowerCase(), {
        address: other,
        last_message: msg,
        unread_count: 0, // TODO: Implement unread count tracking
      });
    }
  }

  return Array.from(conversationsMap.values()).sort((a, b) => {
    if (!a.last_message) return 1;
    if (!b.last_message) return -1;
    return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
  });
}

// Get messages between two users
export async function getMessages(userAddress: string, otherAddress: string): Promise<Message[]> {
  // Check if user is blocked
  const blocked = await isBlocked(userAddress, otherAddress);
  if (blocked) {
    // If blocked, return empty array
    return [];
  }

  // Fetch all messages (including deleted ones to show "deleted" status)
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  // Filter messages between the two users
  const conversationMessages = data.filter(
    (msg) =>
      (msg.from_address.toLowerCase() === userAddress.toLowerCase() &&
        msg.to_address.toLowerCase() === otherAddress.toLowerCase()) ||
      (msg.from_address.toLowerCase() === otherAddress.toLowerCase() &&
        msg.to_address.toLowerCase() === userAddress.toLowerCase())
  );

  // Mark messages as read when user views them (only messages sent TO the user)
  const unreadMessages = conversationMessages.filter(
    (msg) =>
      msg.to_address.toLowerCase() === userAddress.toLowerCase() &&
      msg.from_address.toLowerCase() !== userAddress.toLowerCase() &&
      !msg.read_at
  );

  if (unreadMessages.length > 0) {
    const messageIds = unreadMessages.map((msg) => msg.id);
    const { error: updateError } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .in("id", messageIds);
    
    if (updateError) {
      console.error("Error marking messages as read:", updateError);
    }
  }

  return conversationMessages;
}

// Send a message
export async function sendMessage(fromAddress: string, toAddress: string, content: string): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      from_address: fromAddress,
      to_address: toAddress,
      content: content,
      deleted: false,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message || "Failed to send message");
  }

  return data;
}

// Delete a message (soft delete - shows "This message was deleted" to both users)
export async function deleteMessage(messageId: string, userAddress: string): Promise<boolean> {
  // First check if the message belongs to the user
  const { data: message, error: fetchError } = await supabase
    .from("messages")
    .select("*")
    .eq("id", messageId)
    .single();

  if (fetchError || !message) {
    throw new Error("Message not found");
  }

  if (message.from_address.toLowerCase() !== userAddress.toLowerCase()) {
    throw new Error("Unauthorized: You can only delete your own messages");
  }

  // Soft delete - mark as deleted but keep the message
  const { error } = await supabase
    .from("messages")
    .update({ deleted: true, content: "This message was deleted" })
    .eq("id", messageId);

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message || "Failed to delete message");
  }

  return true;
}

// Clear all messages in a conversation (delete for user only)
export async function clearChat(userAddress: string, otherAddress: string): Promise<boolean> {
  const { error } = await supabase
    .from("messages")
    .update({ deleted: true, content: "This message was deleted" })
    .or(`and(from_address.eq.${userAddress},to_address.eq.${otherAddress}),and(from_address.eq.${otherAddress},to_address.eq.${userAddress})`);

  if (error) {
    console.error("Supabase error:", error);
    throw new Error(error.message || "Failed to clear chat");
  }

  return true;
}

// Block a user
export async function blockUser(blockerAddress: string, blockedAddress: string): Promise<boolean> {
  // Validate addresses
  if (!blockerAddress || !blockedAddress) {
    throw new Error("Invalid addresses");
  }
  if (blockerAddress.toLowerCase() === blockedAddress.toLowerCase()) {
    throw new Error("Cannot block yourself");
  }
  if (blockerAddress.length !== 42 || !blockerAddress.startsWith("0x")) {
    throw new Error("Invalid blocker address format");
  }
  if (blockedAddress.length !== 42 || !blockedAddress.startsWith("0x")) {
    throw new Error("Invalid blocked address format");
  }

  const { error } = await supabase
    .from("blocked_users")
    .insert({
      blocker_address: blockerAddress.toLowerCase(),
      blocked_address: blockedAddress.toLowerCase(),
    });

  if (error) {
    // If already blocked, that's fine
    if (error.code === "23505") {
      return true;
    }
    console.error("Block user error:", error);
    throw new Error(error.message || "Failed to block user");
  }

  return true;
}

// Unblock a user
export async function unblockUser(blockerAddress: string, blockedAddress: string): Promise<boolean> {
  // Validate addresses
  if (!blockerAddress || !blockedAddress) {
    throw new Error("Invalid addresses");
  }
  if (blockerAddress.length !== 42 || !blockerAddress.startsWith("0x")) {
    throw new Error("Invalid blocker address format");
  }
  if (blockedAddress.length !== 42 || !blockedAddress.startsWith("0x")) {
    throw new Error("Invalid blocked address format");
  }

  const { error } = await supabase
    .from("blocked_users")
    .delete()
    .eq("blocker_address", blockerAddress.toLowerCase())
    .eq("blocked_address", blockedAddress.toLowerCase());

  if (error) {
    console.error("Unblock user error:", error);
    throw new Error(error.message || "Failed to unblock user");
  }

  return true;
}

// Get all blocked users for a user
export async function getBlockedUsers(userAddress: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("*")
    .eq("blocker_address", userAddress);

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }

  if (!data) {
    return [];
  }

  return data.map((block) => block.blocked_address.toLowerCase());
}

// Check if user is blocked
export async function isBlocked(userAddress: string, otherAddress: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("blocked_users")
    .select("*");

  if (error) {
    console.error("Supabase error:", error);
    return false;
  }

  if (!data) {
    return false;
  }

  // Filter in memory
  return data.some(
    (block) =>
      (block.blocker_address.toLowerCase() === userAddress.toLowerCase() &&
        block.blocked_address.toLowerCase() === otherAddress.toLowerCase()) ||
      (block.blocker_address.toLowerCase() === otherAddress.toLowerCase() &&
        block.blocked_address.toLowerCase() === userAddress.toLowerCase())
  );
}

// ============================================
// FOLLOWERS/FOLLOWING FUNCTIONS
// ============================================

// Sync follow relationship to Supabase
export async function syncFollowToSupabase(followerAddress: string, followingAddress: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("followers")
      .upsert(
        {
          follower_address: followerAddress.toLowerCase(),
          following_address: followingAddress.toLowerCase(),
          created_at: new Date().toISOString(),
        },
        {
          onConflict: "follower_address,following_address",
        }
      )
      .select();

    if (error) {
      // Check if table doesn't exist
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("relation") && error.message?.includes("does not exist")) {
        console.warn("⚠️  Followers table does not exist. Skipping sync. Please run backend/supabase-followers-schema.sql in Supabase SQL Editor.");
        return;
      }
      console.error("Error syncing follow to Supabase:", error);
      throw error; // Re-throw to be caught by caller
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Follow relationship synced: ${followerAddress.slice(0, 6)}... -> ${followingAddress.slice(0, 6)}...`);
    }
  } catch (err) {
    console.error("Exception syncing follow to Supabase:", err);
    throw err; // Re-throw to be caught by caller
  }
}

// Remove follow relationship from Supabase
export async function syncUnfollowFromSupabase(followerAddress: string, followingAddress: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("followers")
      .delete()
      .eq("follower_address", followerAddress.toLowerCase())
      .eq("following_address", followingAddress.toLowerCase())
      .select();

    if (error) {
      // Check if table doesn't exist
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("relation") && error.message?.includes("does not exist")) {
        console.warn("⚠️  Followers table does not exist. Skipping sync. Please run backend/supabase-followers-schema.sql in Supabase SQL Editor.");
        return;
      }
      console.error("Error syncing unfollow from Supabase:", error);
      throw error; // Re-throw to be caught by caller
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Unfollow relationship synced: ${followerAddress.slice(0, 6)}... -> ${followingAddress.slice(0, 6)}...`);
    }
  } catch (err) {
    console.error("Exception syncing unfollow from Supabase:", err);
    throw err; // Re-throw to be caught by caller
  }
}

// Get followers from Supabase (with fallback to on-chain)
export async function getFollowersFromSupabase(userAddress: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("followers")
      .select("follower_address")
      .eq("following_address", userAddress.toLowerCase());

    if (error) {
      // Check if table doesn't exist (code 42P01 in PostgreSQL)
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("relation") && error.message?.includes("does not exist")) {
        console.warn("⚠️  Followers table does not exist. Please run backend/supabase-followers-schema.sql in Supabase SQL Editor.");
        return [];
      }
      console.error("Error getting followers from Supabase:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((row) => row.follower_address);
  } catch (err) {
    console.error("Exception getting followers from Supabase:", err);
    return [];
  }
}

// Get following from Supabase (with fallback to on-chain)
export async function getFollowingFromSupabase(userAddress: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("followers")
      .select("following_address")
      .eq("follower_address", userAddress.toLowerCase());

    if (error) {
      // Check if table doesn't exist (code 42P01 in PostgreSQL)
      if (error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("relation") && error.message?.includes("does not exist")) {
        console.warn("⚠️  Followers table does not exist. Please run backend/supabase-followers-schema.sql in Supabase SQL Editor.");
        return [];
      }
      console.error("Error getting following from Supabase:", error);
      return [];
    }

    if (!data) {
      return [];
    }

    return data.map((row) => row.following_address);
  } catch (err) {
    console.error("Exception getting following from Supabase:", err);
    return [];
  }
}

