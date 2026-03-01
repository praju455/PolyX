"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useAccount } from "wagmi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

interface Props {
  children: React.ReactNode;
}

export function OnboardingGate({ children }: Props) {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [handle, setHandle] = useState("");
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

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile", address],
    queryFn: () => (address ? api.profileByOwner(address) : Promise.reject("no address")),
    enabled: Boolean(address),
    retry: false,
  });

  useEffect(() => {
    const check = async () => {
      if (!handle) return;
      setChecking(true);
      try {
        const res = await api.handleAvailable(handle);
        setAvailable(res.available);
      } catch {
        setAvailable(null);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [handle]);

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

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
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const result = await api.uploadToPinata(file.name, file.type, base64);
          setAvatarCid(result.cid);
          setAvatarPreview(result.url);
        } catch (error: any) {
          alert(error.message || "Failed to upload avatar");
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      reader.onerror = () => {
        alert("Failed to read file");
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert(error.message || "Failed to upload avatar");
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
      reader.onloadend = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const result = await api.uploadToPinata(file.name, file.type, base64);
          setHeaderCid(result.cid);
          setHeaderPreview(result.url);
        } catch (error: any) {
          alert(error.message || "Failed to upload header");
        } finally {
          setIsUploadingHeader(false);
        }
      };
      reader.onerror = () => {
        alert("Failed to read file");
        setIsUploadingHeader(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      alert(error.message || "Failed to upload header");
      setIsUploadingHeader(false);
    }
  };

  const createProfile = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect wallet first");
      return api.profileCreate({ user: address, handle, displayName, bio, avatarCid, headerCid });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", address] });
      window.location.reload();
    },
  });

  const missingProfile = mounted && isConnected && !loadingProfile && !profile;
  const disableSubmit = !handle || !displayName || createProfile.isPending || checking || available === false;

  const statusLabel = useMemo(() => {
    if (!handle) return "";
    if (checking) return "Checking...";
    if (available === false) return "Handle taken";
    if (available === true) return "Handle available";
    return "";
  }, [handle, checking, available]);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {missingProfile ? (
        <div className="glass rounded-3xl p-6 space-y-4">
          <p className="text-xl font-semibold">Set up your profile</p>
          <div className="grid md:grid-cols-2 gap-3">
            <label className="space-y-1 text-sm">
              <span>Handle (unique)</span>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3"
                value={handle}
                onChange={(e) => setHandle(e.target.value.trim().toLowerCase())}
                placeholder="yourname"
              />
              <span className="text-xs text-white/60">{statusLabel}</span>
            </label>
            <label className="space-y-1 text-sm">
              <span>Display name</span>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </label>
          </div>
          <label className="space-y-1 text-sm block">
            <span>Bio</span>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={200}
            />
          </label>
          
          {/* Avatar Upload */}
          <div className="space-y-2">
            <label className="text-sm">Profile Picture</label>
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
              )}
              <div>
              <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload-onboarding"
                />
                <label
                  htmlFor="avatar-upload-onboarding"
                  className="cursor-pointer btn-secondary inline-block"
                >
                  {isUploadingAvatar ? "Uploading..." : "📷 Upload Avatar"}
            </label>
              </div>
            </div>
          </div>

          {/* Header Upload */}
          <div className="space-y-2">
            <label className="text-sm">Header Image (optional)</label>
            <div className="flex items-center gap-4">
              {headerPreview ? (
                <img src={headerPreview} alt="Header preview" className="w-full h-32 rounded-xl object-cover" />
              ) : (
                <div className="w-full h-32 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
              )}
              <div>
              <input
                  ref={headerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleHeaderUpload}
                  className="hidden"
                  id="header-upload-onboarding"
                />
                <label
                  htmlFor="header-upload-onboarding"
                  className="cursor-pointer btn-secondary inline-block"
                >
                  {isUploadingHeader ? "Uploading..." : "📷 Upload Header"}
            </label>
              </div>
            </div>
          </div>

          <button className="btn-primary w-full" disabled={disableSubmit} onClick={() => createProfile.mutate()}>
            {createProfile.isPending ? "Creating..." : "Create profile"}
          </button>
          {createProfile.error ? (
            <p className="text-red-400 text-sm">{(createProfile.error as Error).message}</p>
          ) : null}
        </div>
      ) : (
        children
      )}
    </>
  );
}
