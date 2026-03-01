import { contract, fetchPostCount, readPost, comment, extractPostIdFromReceipt } from "./contract.js";
import { isMentioned, respondToMention } from "./chatbot.js";

// Track the last post ID we've checked
let lastCheckedPostId = 0;
let isMonitoring = false;
let monitorInterval: NodeJS.Timeout | null = null;

// Store post IDs we've already responded to (in production, use a database)
const respondedPostIds = new Set<number>();

/**
 * Remove a post from the responded set (useful when a response fails and we want to retry)
 */
export function unmarkPostAsResponded(postId: number): void {
  respondedPostIds.delete(postId);
}

/**
 * Check for new posts that mention the chatbot and respond to them
 */
async function checkForMentions(): Promise<void> {
  try {
    const CHATBOT_ADDRESS = process.env.CHATBOT_ADDRESS;
    if (!CHATBOT_ADDRESS || CHATBOT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      console.log("⚠️  CHATBOT_ADDRESS not configured. Mention monitoring disabled.");
      return;
    }

    const currentPostCount = await fetchPostCount();
    
    // If we haven't checked before, check recent posts to catch any mentions while sleeping
    if (lastCheckedPostId === 0) {
      // On first run, check the last 50 posts to catch any mentions posted while backend was inactive
      const lookbackCount = 50;
      const startId = Math.max(1, currentPostCount - lookbackCount);
      lastCheckedPostId = Math.max(0, startId - 1);
      console.log(`📊 Starting mention monitoring - checking posts ${startId} to ${currentPostCount - 1} (last ${lookbackCount} posts)`);
    }

    // Check all new posts since last check
    const newPostIds: number[] = [];
    for (let id = lastCheckedPostId + 1; id < currentPostCount; id++) {
      newPostIds.push(id);
    }

    if (newPostIds.length === 0) {
      return; // No new posts
    }

    console.log(`🔍 Checking ${newPostIds.length} new posts for mentions...`);

    // Process posts in batches to avoid overwhelming the RPC
    const batchSize = 10;
    for (let i = 0; i < newPostIds.length; i += batchSize) {
      const batch = newPostIds.slice(i, i + batchSize);
      
      for (const postId of batch) {
        try {
          // CRITICAL: Skip if we've already responded to this post
          // This prevents duplicate responses even if checked multiple times
          if (respondedPostIds.has(postId)) {
            continue; // Skip this post entirely
          }

          const post = await readPost(postId);
          
          // Skip deleted posts
          if (post.deleted) {
            continue;
          }

          // Skip if it's a comment (we handle comments separately in the API)
          // Only check original posts, quotes, and retweets
          if (post.postType === 3) { // Comment type
            continue;
          }

          // Check if post mentions the chatbot
          if (isMentioned(post.content)) {
            // Double-check we haven't responded (race condition protection)
            if (respondedPostIds.has(postId)) {
              console.log(`⏭️  Skipping post ${postId} - already responded (race condition check)`);
              continue;
            }
            
            // Mark as responded IMMEDIATELY to prevent duplicate responses
            // This must happen BEFORE we try to respond
            respondedPostIds.add(postId);
            console.log(`🤖 Found mention in post ${postId} by ${post.author.slice(0, 6)}... - responding once`);
            
            try {
              // Generate response
              const response = await respondToMention(
                post.content,
                post.author,
                postId
              );

              // Post the response as a comment
              const receipt = await comment(CHATBOT_ADDRESS, postId, response, "");
              const commentId = extractPostIdFromReceipt(receipt);
              
              console.log(`✅ Chatbot responded to mention in post ${postId} (comment ID: ${commentId}) - ONE TIME ONLY`);
            } catch (err: any) {
              console.error(`❌ Failed to respond to mention in post ${postId}:`, err.message);
              // Remove from responded set so we can retry later (only if it failed)
              respondedPostIds.delete(postId);
            }
          }
        } catch (err: any) {
          console.error(`❌ Error checking post ${postId}:`, err.message);
          // Continue checking other posts
        }
      }
    }

    // Update last checked post ID
    lastCheckedPostId = currentPostCount - 1;
  } catch (err: any) {
    console.error("❌ Error in mention monitoring:", err.message);
  }
}

/**
 * Start monitoring for mentions
 * @param intervalMs - How often to check for new posts (default: 30 seconds)
 */
export function startMentionMonitoring(intervalMs: number = 30000): void {
  if (isMonitoring) {
    console.log("⚠️  Mention monitoring is already running");
    return;
  }

  const CHATBOT_ADDRESS = process.env.CHATBOT_ADDRESS;
  if (!CHATBOT_ADDRESS || CHATBOT_ADDRESS === "0x0000000000000000000000000000000000000000") {
    console.log("⚠️  CHATBOT_ADDRESS not configured. Mention monitoring disabled.");
    return;
  }

  isMonitoring = true;
  console.log(`🚀 Starting mention monitoring (checking every ${intervalMs / 1000}s)`);

  // Check immediately on start
  checkForMentions().catch((err) => {
    console.error("Error in initial mention check:", err);
  });

  // Then check periodically
  monitorInterval = setInterval(() => {
    checkForMentions().catch((err) => {
      console.error("Error in periodic mention check:", err);
    });
  }, intervalMs);
}

/**
 * Stop monitoring for mentions
 */
export function stopMentionMonitoring(): void {
  if (!isMonitoring) {
    return;
  }

  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }

  isMonitoring = false;
  console.log("🛑 Stopped mention monitoring");
}

/**
 * Manually trigger a check for mentions (useful for testing or webhooks)
 */
export async function triggerMentionCheck(): Promise<void> {
  console.log("🔔 Manual mention check triggered");
  await checkForMentions();
}

/**
 * Mark a post as already responded to (useful when responding via API)
 * Returns true if it was already marked, false if it's a new mark
 */
export function markPostAsResponded(postId: number): boolean {
  if (respondedPostIds.has(postId)) {
    return true; // Already responded
  }
  respondedPostIds.add(postId);
  return false; // Newly marked
}

