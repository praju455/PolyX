"use client";

import { useEffect, useState, useRef } from "react";
import { useAccount } from "wagmi";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, Profile } from "../../lib/api";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card-3d p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected || !address) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-3d p-12 text-center space-y-4"
        >
          <div className="text-6xl mb-4 float">⚙️</div>
          <h1 className="text-3xl font-bold gradient-text">Account Settings</h1>
          <p className="text-gray-400">Connect your wallet to manage your account settings</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Link href="/profile" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
          ← Back to Profile
        </Link>
        <h1 className="text-4xl font-bold gradient-text">Account Settings</h1>
      </motion.div>

      <AccountSettingsForm address={address} />
    </div>
  );
}

function AccountSettingsForm({ address }: { address: string }) {
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

  const { data: profile, isPending } = useQuery<Profile>({
    queryKey: ["profile", address],
    queryFn: () => api.profileByOwner(address),
    enabled: Boolean(address),
    retry: false,
  });

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
      alert("Avatar uploaded! Click 'Save Changes' to update your profile.");
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
      alert("Header uploaded! Click 'Save Changes' to update your profile.");
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
      alert("Profile updated successfully!");
      window.location.href = "/profile";
    },
  });

  if (isPending) {
    return (
      <div className="card-3d p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/2" />
          <div className="h-32 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-3d p-12 text-center space-y-4"
      >
        <h2 className="text-2xl font-bold text-white">Profile not found</h2>
        <p className="text-gray-400">Please create your profile first.</p>
        <Link href="/" className="btn-3d inline-block">
          Create Profile
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-3d p-8 space-y-8"
    >
      <h2 className="text-2xl font-semibold gradient-text">Update Profile</h2>

      {/* Avatar Upload */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-white">Profile Picture</label>
        <div className="flex items-center gap-6">
          {avatarPreview ? (
            <div className="relative group">
              <img 
                src={avatarPreview} 
                alt="Avatar preview" 
                className="w-32 h-32 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-lg group-hover:scale-105 transition-transform" 
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-5xl border-2 border-indigo-500/30">
              👤
            </div>
          )}
          <div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-upload-settings"
            />
            <label
              htmlFor="avatar-upload-settings"
              className="btn-3d cursor-pointer inline-block"
            >
              {isUploadingAvatar ? "Uploading..." : "📷 Upload Avatar"}
            </label>
          </div>
        </div>
      </div>

      {/* Header Upload */}
      <div className="space-y-4">
        <label className="text-sm font-medium text-white">Header Image</label>
        <div className="space-y-3">
          {headerPreview ? (
            <img 
              src={headerPreview} 
              alt="Header preview" 
              className="w-full h-64 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-lg" 
            />
          ) : (
            <div className="w-full h-64 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border-2 border-indigo-500/30" />
          )}
          <div>
            <input
              ref={headerInputRef}
              type="file"
              accept="image/*"
              onChange={handleHeaderUpload}
              className="hidden"
              id="header-upload-settings"
            />
            <label
              htmlFor="header-upload-settings"
              className="btn-3d cursor-pointer inline-block"
            >
              {isUploadingHeader ? "Uploading..." : "📷 Upload Header"}
            </label>
          </div>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white">Display Name</label>
        <input
          className="w-full bg-slate-800/50 border border-indigo-500/30 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-500 transition-all"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
        />
      </div>

      {/* Bio */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white">Bio</label>
        <textarea
          className="w-full bg-slate-800/50 border border-indigo-500/30 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-gray-500 transition-all resize-none"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself"
          maxLength={200}
          rows={4}
        />
        <p className="text-xs text-gray-400">{bio.length}/200</p>
      </div>

      {/* Handle (read-only) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white">Handle (Username)</label>
        <input
          className="w-full bg-slate-800/30 border border-gray-700/50 rounded-xl p-4 opacity-50 cursor-not-allowed text-white"
          value={profile.handle}
          disabled
          placeholder="Handle cannot be changed"
        />
        <p className="text-xs text-gray-500">Handle cannot be changed after creation</p>
      </div>

      {/* Wallet Address (read-only) */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-white">Wallet Address</label>
        <input
          className="w-full bg-slate-800/30 border border-gray-700/50 rounded-xl p-4 opacity-50 cursor-not-allowed font-mono text-sm text-white"
          value={address}
          disabled
        />
      </div>

      {/* Save Button */}
      <button
        className="btn-3d w-full"
        disabled={update.isPending || !displayName}
        onClick={() => update.mutate()}
      >
        {update.isPending ? "Saving..." : "Save Changes"}
      </button>

      {update.error && (
        <p className="text-red-400 text-sm">{(update.error as Error).message}</p>
      )}
    </motion.div>
  );
}
