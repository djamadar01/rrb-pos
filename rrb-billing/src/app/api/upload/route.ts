import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { isR2Configured, uploadToR2 } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== "OWNER" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Security Validation: Maximum 5MB file size
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    // Security Validation: Strict image MIME type allowlist
    const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const mimeType = file.type?.toLowerCase();
    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed." }, { status: 400 });
    }

    // Sanitize filename to alphanumeric and safe characters
    const sanitizedFileName = (file.name || "dish.jpg").replace(/[^a-zA-Z0-9._-]/g, "_");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. If Cloudflare R2 is configured, upload directly to Cloudflare R2 CDN!
    if (isR2Configured()) {
      try {
        const fileUrl = await uploadToR2(buffer, sanitizedFileName, mimeType);
        return NextResponse.json({ success: true, url: fileUrl, storage: "cloudflare_r2" });
      } catch (r2Error) {
        console.error("Cloudflare R2 upload failed, falling back to base64:", r2Error);
      }
    }

    // 2. Fallback: Base64 data URL if R2 credentials are not yet entered
    const base64Data = buffer.toString('base64');
    const fileUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({ success: true, url: fileUrl, storage: "base64_fallback" });
  } catch (error) {
    console.error("Failed to upload image:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
