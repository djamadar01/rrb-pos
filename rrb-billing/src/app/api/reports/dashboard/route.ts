import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Aggregate total revenue for today
    const revenueAgg = await prisma.bill.aggregate({
      _sum: { finalAmount: true },
      where: { 
        status: "PAID",
        createdAt: { gte: today }
      },
    });
    const totalRevenue = revenueAgg._sum.finalAmount || 0;

    // Aggregate payments by method for today
    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: today },
        status: "COMPLETED"
      }
    });

    const cashPayments = payments.filter(p => p.method === "CASH").reduce((sum, p) => sum + p.amount, 0);
    const onlinePayments = payments.filter(p => p.method === "ONLINE").reduce((sum, p) => sum + p.amount, 0);

    // Count bills for today
    const totalBills = await prisma.bill.count({
      where: { 
        status: "PAID",
        createdAt: { gte: today }
      },
    });

    // Count active shifts
    const activeShifts = await prisma.managerShift.count({
      where: { status: "ACTIVE" },
    });

    // Get outlets and calculate today's revenue per outlet
    const outlets = await prisma.outlet.findMany({
      include: {
        bills: {
          where: { 
            status: "PAID",
            createdAt: { gte: today }
          },
          select: { finalAmount: true }
        }
      }
    });

    const outletsWithRevenue = outlets.map(outlet => {
      const revenue = outlet.bills.reduce((sum, bill) => sum + bill.finalAmount, 0);
      return {
        id: outlet.id,
        name: outlet.name,
        revenue,
      };
    });

    // Get recent audit logs
    const recentLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent bills globally (for today only)
    const recentBills = await prisma.bill.findMany({
      where: {
        createdAt: { gte: today }
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // up to 100 today
      include: {
        outlet: { select: { name: true } },
        creator: { select: { name: true } }
      }
    });

    return NextResponse.json({
      stats: {
        revenue: totalRevenue,
        bills: totalBills,
        cashPayments,
        onlinePayments
      },
      outlets: outletsWithRevenue,
      recentBills,
      logs: recentLogs.map(log => ({
        id: log.id,
        time: log.createdAt.toISOString(),
        action: `${log.action} - ${log.targetType} ${log.targetId}`,
        reason: log.details ? JSON.stringify(log.details) : "N/A"
      }))
    });

  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
