import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export async function POST(request: NextRequest) {
  try {
    const { filename } = await request.json();

    if (!filename || typeof filename !== "string") {
      return NextResponse.json({ error: "Missing filename" }, { status: 400 });
    }

    // List files in /avatars folder and find matching filename
    const files = await imagekit.listFiles({
      path: "/avatars",
      searchQuery: `name="${filename}"`,
    });

    if (files.length === 0) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const file = files[0];
    if (!("fileId" in file)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    await imagekit.deleteFile(file.fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Xóa ảnh thất bại. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}
