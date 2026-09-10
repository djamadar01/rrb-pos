import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isR2Configured, uploadToR2 } from "@/lib/r2";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "Cloudflare R2 is not configured in environment variables." },
        { status: 400 }
      );
    }

    let dishesMigrated = 0;
    let categoriesMigrated = 0;

    // 1. Migrate MenuItems with Base64 images
    const menuItems = await prisma.menuItem.findMany({
      where: {
        imageUrl: { startsWith: "data:image/" }
      }
    });

    for (const item of menuItems) {
      if (!item.imageUrl) continue;
      try {
        const matches = item.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const r2Url = await uploadToR2(buffer, `${item.id}.jpg`, contentType);
          await prisma.menuItem.update({
            where: { id: item.id },
            data: { imageUrl: r2Url }
          });
          dishesMigrated++;
        }
      } catch (err) {
        console.error(`Failed to migrate dish ${item.name}:`, err);
      }
    }

    // 2. Migrate Categories with Base64 images
    const categories = await prisma.category.findMany({
      where: {
        imageUrl: { startsWith: "data:image/" }
      }
    });

    for (const cat of categories) {
      if (!cat.imageUrl) continue;
      try {
        const matches = cat.imageUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const r2Url = await uploadToR2(buffer, `cat-${cat.id}.jpg`, contentType);
          await prisma.category.update({
            where: { id: cat.id },
            data: { imageUrl: r2Url }
          });
          categoriesMigrated++;
        }
      } catch (err) {
        console.error(`Failed to migrate category ${cat.name}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${dishesMigrated} dishes and ${categoriesMigrated} categories to Cloudflare R2 CDN!`,
      dishesMigrated,
      categoriesMigrated
    });
  } catch (error) {
    console.error("Migration to Cloudflare R2 failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
