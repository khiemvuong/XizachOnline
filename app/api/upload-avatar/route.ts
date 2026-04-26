import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Simple in-memory rate limit (per deploy instance)
const uploadTimestamps = new Map<string, number>();
const RATE_LIMIT_MS = 30_000; // 30 seconds

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file || !userId) {
      return NextResponse.json({ error: "Missing file or userId" }, { status: 400 });
    }

    // Rate limit
    const lastUpload = uploadTimestamps.get(userId);
    if (lastUpload && Date.now() - lastUpload < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: "Vui lòng chờ 30 giây trước khi upload lại." },
        { status: 429 },
      );
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Chỉ chấp nhận ảnh JPEG, PNG, WebP, hoặc GIF." },
        { status: 400 },
      );
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Ảnh quá lớn. Giới hạn 2MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await imagekit.upload({
      file: buffer,
      fileName: `avatar_${userId}_${Date.now()}`,
      folder: "/avatars",
      useUniqueFileName: true,
      tags: ["avatar", userId],
    });

    uploadTimestamps.set(userId, Date.now());

    // Clean old entries periodically
    if (uploadTimestamps.size > 500) {
      const cutoff = Date.now() - RATE_LIMIT_MS * 10;
      for (const [key, ts] of uploadTimestamps) {
        if (ts < cutoff) uploadTimestamps.delete(key);
      }
    }

    return NextResponse.json({
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Upload thất bại. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
