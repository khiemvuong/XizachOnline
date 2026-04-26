"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Save, X, Loader2 } from "lucide-react";
import AvatarDisplay from "./AvatarDisplay";

interface PlayerProfileModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  avatarUrl: string | null;
  userId: string;
  onSave: (name: string, avatarUrl: string | null) => void;
  /** Additional class for theme styling */
  themeClass?: string;
}

export default function PlayerProfileModal({
  open,
  onClose,
  name,
  avatarUrl,
  userId,
  onSave,
  themeClass = "",
}: PlayerProfileModalProps) {
  const [draftName, setDraftName] = useState(name);
  const [draftAvatar, setDraftAvatar] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync when modal re-opens
  useEffect(() => {
    if (open) {
      setDraftName(name);
      setDraftAvatar(avatarUrl);
      setError("");
    }
  }, [open, name, avatarUrl]);
  
  const compressImage = (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(blob || file);
            },
            "image/jpeg",
            0.8
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError("");

      try {
        // Validation before processing
        if (file.size > 10 * 1024 * 1024) { // 10MB limit for raw file
          setError("File quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.");
          setUploading(false);
          return;
        }

        let fileToUpload: Blob | File = file;
        
        // Compress if it's an image and not too small already
        if (file.type.startsWith("image/") && file.size > 200 * 1024) {
          fileToUpload = await compressImage(file);
        }

        const formData = new FormData();
        formData.append("file", fileToUpload, "avatar.jpg");
        formData.append("userId", userId);

        const res = await fetch("/api/upload-avatar", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Upload thất bại.");
          return;
        }

        setDraftAvatar(data.url);
      } catch {
        setError("Không thể upload. Kiểm tra kết nối mạng.");
      } finally {
        setUploading(false);
      }
    },
    [userId],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        void handleUpload(file);
      }
      // Reset input so same file can be re-selected
      e.target.value = "";
    },
    [handleUpload],
  );

  const handleSave = () => {
    const finalName = draftName.trim().slice(0, 14) || name;
    onSave(finalName, draftAvatar);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={`relative mx-4 w-full max-w-sm rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[#111520] p-5 shadow-2xl ${themeClass}`}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-[rgba(255,255,255,0.5)] transition hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[rgba(255,255,255,0.9)]">
          Hồ sơ cá nhân
        </h2>

        {/* Avatar section */}
        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="relative">
            <AvatarDisplay
              avatarUrl={draftAvatar}
              name={draftName || name}
              size={80}
              className="border-2 border-[rgba(255,255,255,0.15)]"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[#1a1f2e] text-[rgba(255,255,255,0.7)] transition hover:bg-[#252b3d] disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-[10px] uppercase tracking-[0.12em] text-[rgba(255,255,255,0.4)]">
            Nhấn để đổi avatar (tùy chọn)
          </p>

          {draftAvatar && (
            <button
              onClick={() => setDraftAvatar(null)}
              className="text-[10px] uppercase tracking-[0.14em] text-red-400 transition hover:text-red-300"
            >
              Xóa avatar
            </button>
          )}
        </div>

        {/* Name input */}
        <div className="mt-5">
          <label className="mb-1.5 block text-[10px] uppercase tracking-[0.18em] text-[rgba(255,255,255,0.5)]">
            Tên hiển thị
          </label>
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value.slice(0, 14))}
            className="w-full rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[rgba(255,255,255,0.3)]"
            placeholder="Nhập tên..."
          />
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-400">{error}</p>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={uploading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[rgba(255,255,255,0.1)] py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[rgba(255,255,255,0.15)] disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Lưu
        </button>
      </div>
    </div>
  );
}
