import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { type, token, range = "week" } = await req.json();

    // Mock 2FA Verification for Demo
    if (token !== "123456") {
      await logAuditAction({
        userId: session.user.id,
        role: session.user.role,
        action: "FAILED_2FA_EXPORT",
        targetType: "REPORT",
        targetId: type,
        details: { reason: "Invalid 2FA token provided" }
      });
      return NextResponse.json({ error: "Invalid 2FA Token" }, { status: 403 });
    }

    const startDate = new Date();
    if (range === "day") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Fetch all paid bills for export within the range
    const bills = await prisma.bill.findMany({
      where: { 
        status: "PAID",
        createdAt: { gte: startDate }
      },
      include: {
        outlet: { select: { name: true } },
        creator: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    await logAuditAction({
      userId: session.user.id,
      role: session.user.role,
      action: "EXPORT_REPORT",
      targetType: "REPORT",
      targetId: type,
      details: { recordCount: bills.length }
    });

    if (type === "CSV") {
      const header = "Bill Number,Outlet,Creator,Subtotal,Tax,Final Amount,Date\n";
      const rows = bills.map(b => 
        `${b.billNumber},"${b.outlet?.name}","${b.creator?.name}",${b.subtotal},${b.taxAmount},${b.finalAmount},${b.createdAt.toISOString()}`
      ).join("\n");
      
      const csv = header + rows;
      
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="revenue_report.csv"'
        }
      });
    }

    // For PDF, we'll return a formatted text file as a mock since PDF requires external libs
    if (type === "PDF") {
      let text = "RRB Fast Food - Official Tax Report\n";
      text += "===================================\n\n";
      bills.forEach(b => {
        text += `Bill: ${b.billNumber} | Outlet: ${b.outlet?.name} | Total: ₹${b.finalAmount.toFixed(2)} | Date: ${b.createdAt.toISOString()}\n`;
      });
      
      return new NextResponse(text, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename="tax_report.txt"'
        }
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 });
  }
}
