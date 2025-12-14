import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { useAccount } from "wagmi";
import { api } from "../lib/api";

interface Props {
  mode?: "tweet" | "quote" | "comment";
  referenceId?: number;
  onDone?: () => void;
}

export function Composer({ mode = "tweet", referenceId, onDone }: Props) {
  const [text, setText] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadToPinata = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        try {
          const result = await api.uploadToPinata(file.name, file.type, base64);
          resolve(result.cid);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect wallet first");

      let mediaCid = "";
      if (mediaFile) {
        setIsUploading(true);
        try {
          mediaCid = await uploadToPinata(mediaFile);
        } catch (error) {
          setIsUploading(false);
          throw new Error("Failed to upload media");
        }
        setIsUploading(false);
      }

      if (mode === "tweet") {
        return api.tweet(address, text, mediaCid);
      }
      if (mode === "comment") {
        if (!referenceId) throw new Error("Missing referenceId");
        return api.comment(address, referenceId, text, mediaCid);
      }
      if (mode === "quote") {
        if (!referenceId) throw new Error("Missing referenceId");
        return api.quote(address, referenceId, text, mediaCid);
      }
      throw new Error("Invalid mode");
    },
    onSuccess: (data) => {
      setText("");
      setMediaFile(null);
      setMediaPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["posts", "author"] });
      // Invalidate notifications if it's a comment or quote
      if (mode === "comment" || mode === "quote") {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
      onDone?.();
    },
  });

  const isLoading = mutation.isPending || isUploading;

  return (
    <div className="card-3d p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-lg gradient-text">
          {mode === "tweet" ? "What's happening?" : mode === "comment" ? "Add a comment" : "Quote tweet"}
        </p>
        <span className="text-xs text-gray-400">{text.length}/280</span>
      </div>
      <textarea
        className="w-full bg-slate-800/50 border border-indigo-500/30 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-base text-white placeholder-gray-500 transition-all"
        placeholder={mode === "tweet" ? "Share your thoughts..." : mode === "comment" ? "Write a comment..." : "Add your thoughts..."}
        rows={mode === "tweet" ? 4 : 3}
        maxLength={280}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {mediaPreview && (
        <div className="relative rounded-xl overflow-hidden border border-white/10">
          <img src={mediaPreview} alt="Preview" className="w-full h-auto max-h-64 object-cover" />
          <button
            onClick={() => {
              setMediaFile(null);
              setMediaPreview(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="media-upload"
          />
          <label
            htmlFor="media-upload"
            className="cursor-pointer p-2 opacity-70 hover:opacity-100 hover:bg-white/5 rounded-lg transition-all text-xl"
            title="Add media"
          >
            📷
          </label>
        </div>
        <button
          className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          disabled={(!text && !mediaFile) || isLoading}
          onClick={() => mutation.mutate()}
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>{mode === "tweet" ? "📝" : mode === "comment" ? "💬" : "💭"}</span>
              <span>{mode === "tweet" ? "Tweet" : mode === "comment" ? "Comment" : "Quote"}</span>
            </>
          )}
        </button>
      </div>
      {mutation.error && <p className="text-red-400 text-sm">{(mutation.error as Error).message}</p>}
    </div>
  );
}
