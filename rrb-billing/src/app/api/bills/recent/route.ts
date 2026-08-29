import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const outletId = searchParams.get("outletId");

    const recentBills = await prisma.bill.findMany({
      where: outletId ? { outletId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        creator: { select: { name: true } }
      }
    });

    return NextResponse.json(recentBills);
  } catch (error) {
    console.error("Failed to fetch recent bills:", error);
    return NextResponse.json({ error: "Failed to fetch recent bills" }, { status: 500 });
  }
}
