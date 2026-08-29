import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const bill = await prisma.bill.findUnique({
      where: { id: resolvedParams.id },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        outlet: true,
        creator: true,
        payments: true
      }
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json(bill);
  } catch (error) {
    console.error("Failed to fetch bill:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
