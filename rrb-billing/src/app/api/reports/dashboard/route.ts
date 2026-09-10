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

    // Execute all 7 queries concurrently to avoid sequential round-trip latency to remote DB
    const [
      revenueAgg,
      payments,
      totalBills,
      activeShifts,
      outlets,
      recentLogs,
      recentBills
    ] = await Promise.all([
      // 1. Total revenue for today
      prisma.bill.aggregate({
        _sum: { finalAmount: true },
        where: { 
          status: "PAID",
          createdAt: { gte: today }
        },
      }),

      // 2. Payments for today
      prisma.payment.findMany({
        where: {
          createdAt: { gte: today },
          status: "COMPLETED"
        }
      }),

      // 3. Count bills for today
      prisma.bill.count({
        where: { 
          status: "PAID",
          createdAt: { gte: today }
        },
      }),

      // 4. Count active shifts
      prisma.managerShift.count({
        where: { status: "ACTIVE" },
      }),

      // 5. Outlets with today's revenue
      prisma.outlet.findMany({
        include: {
          bills: {
            where: { 
              status: "PAID",
              createdAt: { gte: today }
            },
            select: { finalAmount: true }
          }
        }
      }),

      // 6. Recent audit logs
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // 7. Recent bills globally for today
      prisma.bill.findMany({
        where: {
          createdAt: { gte: today }
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          outlet: { select: { name: true } },
          creator: { select: { name: true } }
        }
      })
    ]);

    const totalRevenue = revenueAgg._sum.finalAmount || 0;
    const cashPayments = payments.filter(p => p.method === "CASH").reduce((sum, p) => sum + p.amount, 0);
    const onlinePayments = payments.filter(p => p.method === "ONLINE").reduce((sum, p) => sum + p.amount, 0);

    const outletsWithRevenue = outlets.map(outlet => {
      const revenue = outlet.bills.reduce((sum, bill) => sum + bill.finalAmount, 0);
      return {
        id: outlet.id,
        name: outlet.name,
        revenue,
      };
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
