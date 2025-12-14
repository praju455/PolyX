"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useAccount } from "wagmi";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, Profile, Post } from "../../lib/api";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PostCard } from "../../components/PostCard";
import { FollowButton } from "../../components/FollowButton";
import { ProfileStats } from "../../components/ProfileStats";

function ProfileContent() {
  const { address } = useAccount();
  const searchParams = useSearchParams();
  const viewUser = searchParams.get("user");
  const isOwnProfile = !viewUser || viewUser.toLowerCase() === address?.toLowerCase();
  const profileAddress = viewUser || address || "";
  const [activeTab, setActiveTab] = useState<"posts" | "postsAndQuotes" | "postsAndComments">("posts");

  const [mounted, setMounted] = useState(false);
  const [blocked, setBlocked] = useState<string[]>([]);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", profileAddress],
    queryFn: () => {
      if (viewUser) {
        return api.profileByOwner(viewUser);
      }
      return address ? api.profileByOwner(address) : Promise.reject("no address");
    },
    enabled: Boolean(profileAddress),
    retry: false,
  });

  const { data: userPosts, isLoading: loadingPosts } = useQuery<Post[]>({
    queryKey: ["posts", "author", profileAddress],
    queryFn: () => api.postsByAuthor(profileAddress),
    enabled: Boolean(profileAddress),
  });

  const { data: currentUserFollowing } = useQuery<string[]>({
    queryKey: ["following", address],
    queryFn: () => (address ? api.following(address) : Promise.resolve([])),
    enabled: Boolean(address),
    retry: false,
  });

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarCid, setAvatarCid] = useState("");
  const [headerCid, setHeaderCid] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [headerPreview, setHeaderPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingHeader, setIsUploadingHeader] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const stored = JSON.parse(localStorage.getItem("polyx-blocked") || "[]") as string[];
    setBlocked(stored);
  }, []);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setBio(profile.bio);
      setAvatarCid(profile.avatarCid);
      setHeaderCid(profile.headerCid);
      if (profile.avatarCid) {
        setAvatarPreview(`${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${profile.avatarCid}`);
      }
      if (profile.headerCid) {
        setHeaderPreview(`${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${profile.headerCid}`);
      }
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Avatar image must be less than 5MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const result = await api.uploadToPinata(file.name, file.type, base64);
      setAvatarCid(result.cid);
      setAvatarPreview(result.url);
      // Auto-save if on own profile
      if (isOwnProfile && address && profile) {
        try {
          await api.profileUpdate({ 
            user: address, 
            displayName: profile.displayName, 
            bio: profile.bio, 
            avatarCid: result.cid, 
            headerCid: profile.headerCid 
          });
          alert("Avatar updated successfully!");
          window.location.reload();
        } catch (updateError: any) {
          alert("Avatar uploaded but failed to save. Please try again.");
        }
      }
    } catch (error: any) {
      alert(error.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Header image must be less than 10MB");
      return;
    }

    setIsUploadingHeader(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const result = await api.uploadToPinata(file.name, file.type, base64);
      setHeaderCid(result.cid);
      setHeaderPreview(result.url);
      // Auto-save if on own profile
      if (isOwnProfile && address) {
        await api.profileUpdate({ user: address, displayName, bio, avatarCid, headerCid: result.cid });
        alert("Header updated successfully!");
        window.location.reload();
      }
    } catch (error: any) {
      alert(error.message || "Failed to upload header");
    } finally {
      setIsUploadingHeader(false);
    }
  };

  const update = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect wallet first");
      return api.profileUpdate({ user: address, displayName, bio, avatarCid, headerCid });
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  function block(addr: string) {
    const next = [...blocked, addr];
    setBlocked(next);
    localStorage.setItem("polyx-blocked", JSON.stringify(next));
    window.dispatchEvent(new Event("polyx-block-updated"));
  }

  function unblock(addr: string) {
    const next = blocked.filter((b) => b.toLowerCase() !== addr.toLowerCase());
    setBlocked(next);
    localStorage.setItem("polyx-blocked", JSON.stringify(next));
    window.dispatchEvent(new Event("polyx-block-updated"));
  }

  const isBlocked = mounted && profileAddress && blocked.map((b) => b.toLowerCase()).includes(profileAddress.toLowerCase());

  // Filter posts based on active tab
  const filteredPosts = userPosts?.filter((post) => {
    if (activeTab === "posts") {
      return post.postType === 0; // Only original posts
    } else if (activeTab === "postsAndQuotes") {
      return post.postType === 0 || post.postType === 2; // Posts and quotes
    } else if (activeTab === "postsAndComments") {
      return post.postType === 0 || post.postType === 3; // Posts and comments
    }
    return true;
  }) || [];

  if (isLoading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="glass rounded-3xl p-6">
          <p className="text-white/70">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile && profileAddress) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="glass rounded-3xl p-6 text-center space-y-4">
          <h1 className="text-2xl font-bold">Profile not found</h1>
          <p className="text-white/70">This user hasn&apos;t created a profile yet.</p>
          {isOwnProfile && (
            <Link href="/" className="btn-primary inline-block">
              Create your profile
            </Link>
          )}
        </div>
      </main>
    );
  }

  const avatarUrl = avatarPreview || (profile?.avatarCid
    ? `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${profile.avatarCid}`
    : null);
  const headerUrl = headerPreview || (profile?.headerCid
    ? `${process.env.NEXT_PUBLIC_PINATA_GATEWAY || "https://gateway.pinata.cloud"}/ipfs/${profile.headerCid}`
    : null);

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      {/* Profile Header */}
      <div className="card overflow-hidden">
        <div className="relative">
          {headerUrl ? (
            <img src={headerUrl} alt="Header" className="w-full h-48 object-cover" />
          ) : (
            <div className="w-full h-48 bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
          )}
          {isOwnProfile && (
            <div className="absolute top-2 right-2">
              <input
                ref={headerInputRef}
                type="file"
                accept="image/*"
                onChange={handleHeaderUpload}
                className="hidden"
                id="header-upload"
              />
              <label
                htmlFor="header-upload"
                className="cursor-pointer bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded-lg text-sm transition-colors"
              >
                {isUploadingHeader ? "Uploading..." : "📷 Change Header"}
              </label>
            </div>
          )}
        </div>
        <div className="p-6 -mt-16 relative">
          <div className="flex items-end gap-4 mb-4">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.displayName}
                  className="w-24 h-24 rounded-full border-4 border-black object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-black bg-indigo-500/20 flex items-center justify-center text-3xl font-bold">
                  {profile?.displayName.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              {isOwnProfile && (
                <div className="absolute bottom-0 right-0">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white rounded-full p-2 transition-colors"
                  >
                    {isUploadingAvatar ? "..." : "📷"}
                  </label>
                </div>
              )}
            </div>
            {!isOwnProfile && address && mounted && (
              <div className="flex gap-3 ml-auto">
                <FollowButton currentUser={address} targetUser={profileAddress} />
                <Link 
                  href={`/messaging?chat=${profileAddress}`} 
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30 hover:from-indigo-500/30 hover:to-purple-500/30 flex items-center gap-2"
                >
                  <span>💬</span>
                  <span>Message</span>
                </Link>
                {isBlocked ? (
                  <button 
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-red-500/20 to-orange-500/20 text-red-300 border border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30 flex items-center gap-2" 
                    onClick={() => unblock(profileAddress)}
                  >
                    <span>🔓</span>
                    <span>Unblock</span>
                  </button>
                ) : (
                  <button 
                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-300 border border-gray-500/30 hover:from-gray-500/30 hover:to-slate-500/30 flex items-center gap-2" 
                    onClick={() => block(profileAddress)}
                  >
                    <span>🚫</span>
                    <span>Block</span>
                  </button>
                )}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-bold">{profile?.displayName}</h1>
          <p className="text-white/70">@{profile?.handle}</p>
          {profile?.bio && <p className="mt-2 text-white/80">{profile.bio}</p>}
          <p className="mt-2 text-xs text-white/50 font-mono">{profile?.owner}</p>
          <div className="mt-4">
            <ProfileStats 
              userAddress={profileAddress} 
              currentUser={address || undefined}
              followingList={address ? (currentUserFollowing?.map(f => f.toLowerCase()) || []) : undefined}
            />
          </div>
        </div>
      </div>

      {/* Edit Profile Link (Own Profile Only) */}
      {isOwnProfile && profile && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Profile Settings</h2>
            <Link href="/settings" className="btn-primary">
              Edit Profile
            </Link>
          </div>
        </div>
      )}

      {/* Posts Tabs */}
      {profileAddress && (
        <div className="card p-6 space-y-4">
          <div className="flex gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab("posts")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "posts"
                  ? "bg-indigo-500 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Tweets
            </button>
            <button
              onClick={() => setActiveTab("postsAndQuotes")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "postsAndQuotes"
                  ? "bg-indigo-500 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Tweets & Quotes
            </button>
            <button
              onClick={() => setActiveTab("postsAndComments")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "postsAndComments"
                  ? "bg-indigo-500 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Tweets & Comments
            </button>
          </div>

          {loadingPosts ? (
            <div className="text-center py-8 text-white/70">Loading posts...</div>
          ) : filteredPosts.length > 0 ? (
            <div className="space-y-4">
              {filteredPosts
                .filter((post) => post.postType !== 3) // Don't show comments in main list
                .map((post) => (
                  <PostCard key={post.id} post={post} showComments={true} />
                ))}
            </div>
          ) : (
            <div className="text-center py-8 text-white/70">
              <p>No posts found for this filter.</p>
            </div>
          )}
        </div>
      )}

      {/* Blocked Users (Own Profile Only) */}
      {isOwnProfile && mounted && (
        <div className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">Blocked users</h2>
          {blocked.length === 0 ? (
            <p className="text-white/70 text-sm">No one blocked.</p>
          ) : (
            <div className="space-y-2">
              {blocked.map((b) => (
                <div key={b} className="flex items-center justify-between text-sm">
                  <Link href={`/profile?user=${b}`} className="hover:text-indigo-400">
                    {b}
                  </Link>
                  <button className="btn-secondary" onClick={() => unblock(b)}>
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="glass rounded-3xl p-6">
          <p className="text-white/70">Loading profile...</p>
        </div>
      </main>
    }>
      <ProfileContent />
    </Suspense>
  );
}
