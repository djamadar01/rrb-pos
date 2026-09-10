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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'image/jpeg';

    // 1. If Cloudflare R2 is configured, upload directly to Cloudflare R2 CDN!
    if (isR2Configured()) {
      try {
        const fileUrl = await uploadToR2(buffer, file.name || "dish.jpg", mimeType);
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
