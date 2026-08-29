import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "week"; // "day", "week", "month"

    // 1. Get all bills for the selected range
    const startDate = new Date();
    if (range === "day") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "week") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "month") {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    const bills = await prisma.bill.findMany({
      where: {
        createdAt: { gte: startDate },
        status: "PAID"
      },
      include: {
        items: {
          include: { menuItem: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // 2. Compute Top KPIs (Today)
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const todaysBills = bills.filter(b => new Date(b.createdAt) >= today);
    const dailyRevenue = todaysBills.reduce((sum, b) => sum + b.finalAmount, 0);
    const totalOrders = todaysBills.length;
    const avgOrderValue = totalOrders > 0 ? dailyRevenue / totalOrders : 0;

    // 3. Compute Trend (Line Chart)
    const trendMap = new Map<string, number>();
    
    // Initialize X-axis based on range
    if (range === "day") {
      // Last 24 hours (grouped by hour)
      for(let i=23; i>=0; i--) {
        const d = new Date();
        d.setHours(d.getHours() - i);
        const dateString = d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        trendMap.set(dateString, 0);
      }
      bills.forEach(b => {
        const dateString = new Date(b.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        if (trendMap.has(dateString)) {
          trendMap.set(dateString, trendMap.get(dateString)! + b.finalAmount);
        }
      });
    } else if (range === "week") {
      // Last 7 days
      for(let i=6; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trendMap.set(dateString, 0);
      }
      bills.forEach(b => {
        const dateString = new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (trendMap.has(dateString)) {
          trendMap.set(dateString, trendMap.get(dateString)! + b.finalAmount);
        }
      });
    } else if (range === "month") {
      // Last 30 days (grouped by 3-day intervals to avoid chart clutter, or just every day)
      // Let's do every day for exactness, recharts handles skipping labels
      for(let i=29; i>=0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        trendMap.set(dateString, 0);
      }
      bills.forEach(b => {
        const dateString = new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (trendMap.has(dateString)) {
          trendMap.set(dateString, trendMap.get(dateString)! + b.finalAmount);
        }
      });
    }
    
    const chartData = Array.from(trendMap, ([date, revenue]) => ({ date, revenue }));

    // 4. Compute Category Breakdown (Pie Chart) & Top Items
    const categoryMap = new Map<string, number>();
    const itemMap = new Map<string, { name: string, qty: number, revenue: number }>();

    bills.forEach(bill => {
      bill.items.forEach(item => {
        // Categories
        const cat = item.menuItem.categoryId || "Uncategorized";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + item.subtotal);
        
        // Items
        const itemName = item.menuItem.name;
        if (!itemMap.has(itemName)) {
          itemMap.set(itemName, { name: itemName, qty: 0, revenue: 0 });
        }
        const existing = itemMap.get(itemName)!;
        existing.qty += item.quantity;
        existing.revenue += item.subtotal;
      });
    });

    const categoryData = Array.from(categoryMap, ([name, value]) => ({ name, value }));
    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return NextResponse.json({
      dailyRevenue,
      totalOrders,
      avgOrderValue,
      chartData,
      categoryData,
      topItems
    });

  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
