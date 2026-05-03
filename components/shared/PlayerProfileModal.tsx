"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Save, X, Loader2, RotateCcw, RefreshCw } from "lucide-react";
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

type CropPoint = {
  x: number;
  y: number;
};

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const AVATAR_SIZE = 512;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function createCroppedAvatar(imageSrc: string, cropArea: Area, rotation: number): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotatedWidth = image.width * cos + image.height * sin;
  const rotatedHeight = image.width * sin + image.height * cos;
  const sourceCanvas = document.createElement("canvas");
  const sourceContext = sourceCanvas.getContext("2d");

  if (!sourceContext) {
    throw new Error("Không thể xử lý ảnh trên thiết bị này.");
  }

  sourceCanvas.width = rotatedWidth;
  sourceCanvas.height = rotatedHeight;
  sourceContext.translate(rotatedWidth / 2, rotatedHeight / 2);
  sourceContext.rotate(radians);
  sourceContext.translate(-image.width / 2, -image.height / 2);
  sourceContext.drawImage(image, 0, 0);

  const avatarCanvas = document.createElement("canvas");
  const avatarContext = avatarCanvas.getContext("2d");

  if (!avatarContext) {
    throw new Error("Không thể tạo avatar.");
  }

  avatarCanvas.width = AVATAR_SIZE;
  avatarCanvas.height = AVATAR_SIZE;
  avatarContext.imageSmoothingQuality = "high";
  avatarContext.drawImage(
    sourceCanvas,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    AVATAR_SIZE,
    AVATAR_SIZE,
  );

  return new Promise((resolve, reject) => {
    avatarCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Không thể nén avatar."));
      },
      "image/webp",
      0.82,
    );
  });
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
  const [pendingCroppedBlob, setPendingCroppedBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropPoint>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDraftName(name);
      setDraftAvatar(avatarUrl);
      setPendingCroppedBlob(null);
      setError("");
      setCropImage(null);
    }
  }, [open, name, avatarUrl]);

  useEffect(() => {
    return () => {
      if (cropImage) URL.revokeObjectURL(cropImage);
    };
  }, [cropImage]);

  const deleteOldAvatar = useCallback(async (avatarUrl: string | null) => {
    if (!avatarUrl || avatarUrl.startsWith("blob:")) return;
    
    try {
      // Extract filename from URL to search for fileId
      const urlParts = avatarUrl.split("/");
      const filename = urlParts[urlParts.length - 1];
      
      const res = await fetch("/api/delete-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      
      if (!res.ok) {
        console.warn("Failed to delete old avatar:", await res.text());
      }
    } catch (err) {
      console.warn("Failed to delete old avatar:", err);
    }
  }, []);

  const uploadAvatarToImageKit = useCallback(
    async (file: Blob): Promise<{ url: string; fileId: string } | null> => {
      try {
        const formData = new FormData();
        formData.append("file", file, "avatar.webp");
        formData.append("userId", userId);

        const res = await fetch("/api/upload-avatar", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Upload thất bại.");
          return null;
        }

        return { url: data.url, fileId: data.fileId };
      } catch {
        setError("Không thể upload. Kiểm tra kết nối mạng.");
        return null;
      }
    },
    [userId],
  );

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (file.size > MAX_UPLOAD_SIZE) {
      setError("File quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ.");
      return;
    }

    if (cropImage) URL.revokeObjectURL(cropImage);
    setCropImage(URL.createObjectURL(file));
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setError("");
  }, [cropImage]);

  const handleCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const closeCropper = () => {
    if (cropImage) URL.revokeObjectURL(cropImage);
    setCropImage(null);
  };

  const confirmCrop = async () => {
    if (!cropImage || !croppedAreaPixels) return;

    try {
      const croppedAvatar = await createCroppedAvatar(cropImage, croppedAreaPixels, rotation);
      const previewUrl = URL.createObjectURL(croppedAvatar);
      setPendingCroppedBlob(croppedAvatar);
      setDraftAvatar(previewUrl);
      setCropImage(null);
    } catch {
      setError("Không thể crop ảnh này. Vui lòng thử ảnh khác.");
    }
  };

  const handleSave = async () => {
    setUploading(true);
    setError("");

    try {
      let finalAvatarUrl = draftAvatar;

      if (pendingCroppedBlob) {
        await deleteOldAvatar(avatarUrl);
        const result = await uploadAvatarToImageKit(pendingCroppedBlob);
        if (!result) {
          setUploading(false);
          return;
        }
        finalAvatarUrl = result.url;
      } else if (draftAvatar === null && avatarUrl) {
        await deleteOldAvatar(avatarUrl);
      }

      const finalName = draftName.trim().slice(0, 14) || name;
      onSave(finalName, finalAvatarUrl);
      onClose();
    } catch {
      setError("Lưu thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-sm rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[#111520] p-5 shadow-2xl ${themeClass}`}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-[rgba(255,255,255,0.5)] transition hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
          aria-label="Đóng hồ sơ cá nhân"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[rgba(255,255,255,0.9)]">
          Hồ sơ cá nhân
        </h2>

        <div className="mt-5 flex flex-col items-center gap-3">
          <div className="relative">
            <button
              onClick={() => {
                if (draftAvatar && pendingCroppedBlob) {
                  const blobUrl = URL.createObjectURL(pendingCroppedBlob);
                  setCropImage(blobUrl);
                  setCrop({ x: 0, y: 0 });
                  setZoom(1);
                  setRotation(0);
                }
              }}
              disabled={uploading || !pendingCroppedBlob}
              className="transition hover:opacity-80 disabled:cursor-default disabled:opacity-100"
              aria-label="Chỉnh sửa avatar"
            >
              <AvatarDisplay
                avatarUrl={draftAvatar}
                name={draftName || name}
                size={80}
                className="border-2 border-[rgba(255,255,255,0.15)]"
              />
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[#1a1f2e] text-[rgba(255,255,255,0.7)] transition hover:bg-[#252b3d] disabled:opacity-50"
              aria-label="Chọn ảnh avatar"
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
            Chọn ảnh, crop vuông 1:1
          </p>

          {draftAvatar && (
            <button
              onClick={() => {
                if (draftAvatar && draftAvatar.startsWith("blob:")) {
                  URL.revokeObjectURL(draftAvatar);
                }
                setDraftAvatar(null);
                setPendingCroppedBlob(null);
              }}
              disabled={uploading}
              className="text-[10px] uppercase tracking-[0.14em] text-red-400 transition hover:text-red-300 disabled:opacity-50"
            >
              Xóa avatar
            </button>
          )}
        </div>

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

        <button
          onClick={handleSave}
          disabled={uploading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[rgba(255,255,255,0.1)] py-2.5 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[rgba(255,255,255,0.15)] disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Lưu
        </button>
      </div>

      {cropImage && (
        <div className="fixed inset-0 z-210 flex items-center justify-center overflow-y-auto bg-black/80 p-2 backdrop-blur-md sm:p-4">
          <section className="my-auto grid h-[calc(100dvh-16px)] w-full max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-white/15 bg-[#0b101a] shadow-[0_28px_90px_rgba(0,0,0,0.72)] sm:h-[min(720px,calc(100dvh-32px))] sm:rounded-3xl max-[900px]:landscape:max-w-[calc(100vw-16px)] max-[900px]:landscape:grid-cols-[minmax(0,1fr)_260px] max-[900px]:landscape:grid-rows-[auto_minmax(0,1fr)]">
            <header className="flex items-center justify-between border-b border-white/10 px-3 py-2.5 sm:p-4 max-[900px]:landscape:col-span-2 max-[900px]:landscape:py-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.18em] text-white sm:text-sm">
                  Crop avatar
                </h3>
              </div>
              <button
                onClick={closeCropper}
                disabled={uploading}
                className="rounded-full p-2 text-white/55 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label="Đóng crop avatar"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="relative min-h-0 bg-black max-[900px]:landscape:col-start-1 max-[900px]:landscape:row-start-2">
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={handleCropComplete}
              />
            </div>

            <div className="space-y-2.5 p-3 sm:space-y-4 sm:p-4 max-[900px]:landscape:col-start-2 max-[900px]:landscape:row-start-2 max-[900px]:landscape:flex max-[900px]:landscape:flex-col max-[900px]:landscape:justify-center max-[900px]:landscape:space-y-2 max-[900px]:landscape:border-l max-[900px]:landscape:border-white/10 max-[900px]:landscape:p-2.5 max-[900px]:landscape:overflow-y-auto">
              <label className="block max-[900px]:landscape:mb-0">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.14em] text-white/45 sm:mb-2 sm:text-[10px] max-[900px]:landscape:mb-0.5 max-[900px]:landscape:text-[8px]">
                  Zoom
                </span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-cyan-300"
                />
              </label>

              <label className="block max-[900px]:landscape:mb-0">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.14em] text-white/45 sm:mb-2 sm:text-[10px] max-[900px]:landscape:mb-0.5 max-[900px]:landscape:text-[8px]">
                  Xoay
                </span>
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-amber-300"
                />
              </label>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 max-[900px]:landscape:grid-cols-1 max-[900px]:landscape:gap-1.5">
                <button
                  onClick={resetCrop}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/75 transition hover:bg-white/10 disabled:opacity-50 sm:px-4 sm:py-3 sm:text-xs max-[900px]:landscape:py-1.5 max-[900px]:landscape:text-[9px]"
                >
                  <RotateCcw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Reset
                </button>
                <button
                  onClick={() => setRotation((value) => value + 90)}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/75 transition hover:bg-white/10 disabled:opacity-50 sm:px-4 sm:py-3 sm:text-xs max-[900px]:landscape:py-1.5 max-[900px]:landscape:text-[9px]"
                >
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Xoay 90°
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5 sm:gap-3 sm:pt-1 max-[900px]:landscape:grid-cols-1 max-[900px]:landscape:gap-1.5 max-[900px]:landscape:pt-0">
                <button
                  onClick={closeCropper}
                  disabled={uploading}
                  className="rounded-xl border border-white/12 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition hover:bg-white/8 disabled:opacity-50 sm:px-4 sm:py-3 sm:text-xs max-[900px]:landscape:py-1.5 max-[900px]:landscape:text-[9px]"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmCrop}
                  disabled={uploading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#051018] transition hover:bg-cyan-200 disabled:opacity-50 sm:px-4 sm:py-3 sm:text-xs max-[900px]:landscape:py-1.5 max-[900px]:landscape:text-[9px]"
                >
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Dùng ảnh này
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
