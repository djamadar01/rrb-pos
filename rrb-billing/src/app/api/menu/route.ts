import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { isActive: true },
      include: {
        modifiers: true,
        category: true,
      },
    });

    return NextResponse.json(menuItems, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
      }
    });
  } catch (error) {
    console.error("Failed to fetch menu:", error);
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== "OWNER" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, nameMr, nameHi, price, halfPrice, categoryId, imageUrl } = body;

    if (!name || price === undefined || !categoryId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsedHalfPrice = (halfPrice !== undefined && halfPrice !== null && halfPrice !== "") 
      ? parseFloat(halfPrice) 
      : null;

    const newItem = await prisma.menuItem.create({
      data: {
        name,
        nameMr: nameMr ? nameMr.trim() : null,
        nameHi: nameHi ? nameHi.trim() : null,
        price: parseFloat(price),
        halfPrice: parsedHalfPrice,
        categoryId,
        imageUrl
      }
    });

    return NextResponse.json(newItem);
  } catch (error) {
    console.error("Failed to create menu item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== "OWNER" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, name, nameMr, nameHi, price, halfPrice, categoryId, imageUrl, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updatedItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nameMr !== undefined && { nameMr: nameMr ? nameMr.trim() : null }),
        ...(nameHi !== undefined && { nameHi: nameHi ? nameHi.trim() : null }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(halfPrice !== undefined && { 
          halfPrice: (halfPrice === null || halfPrice === "") ? null : parseFloat(halfPrice) 
        }),
        ...(categoryId !== undefined && { categoryId }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("Failed to update menu item:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user.role !== "OWNER" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.menuItem.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete menu item:", error);
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Cannot delete this dish because it is linked to past bills. Please use 'Disable' instead to preserve historical records." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
