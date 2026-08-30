import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

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

    // Vercel serverless environments have a read-only filesystem.
    // Instead of writing to disk, convert the image to a Base64 Data URL.
    const mimeType = file.type || 'image/jpeg';
    const base64Data = buffer.toString('base64');
    const fileUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Failed to upload image:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
