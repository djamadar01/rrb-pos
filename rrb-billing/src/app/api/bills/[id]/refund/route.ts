import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "OWNER" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Only Managers or Owners can refund bills" }, { status: 403 });
    }

    const body = await req.json();
    const { reason } = body;
    const { id } = await params;

    if (!reason || reason.trim() === "") {
      return NextResponse.json({ error: "Refund reason is mandatory" }, { status: 400 });
    }

    const bill = await prisma.bill.findUnique({ where: { id } });
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (bill.status === "REFUNDED" || bill.status === "VOID") {
      return NextResponse.json({ error: "Bill is already refunded or voided" }, { status: 400 });
    }

    const updatedBill = await prisma.bill.update({
      where: { id },
      data: {
        status: "REFUNDED",
        reason,
      },
    });

    await logAuditAction({
      userId: session.user.id,
      role: session.user.role,
      action: "REFUND_BILL",
      targetType: "BILL",
      targetId: updatedBill.id,
      details: { reason, amount: updatedBill.finalAmount }
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error("Failed to refund bill:", error);
    return NextResponse.json({ error: "Failed to refund bill" }, { status: 500 });
  }
}
