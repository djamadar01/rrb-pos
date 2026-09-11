import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { logAuditAction } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idempotencyKey = req.headers.get("idempotency-key");
    if (!idempotencyKey) {
      return NextResponse.json({ error: "Idempotency key required" }, { status: 400 });
    }

    // Check for existing bill with this idempotency key
    const existingBill = await prisma.bill.findUnique({
      where: { idempotencyKey },
      include: { items: { include: { modifiers: true } }, payments: true }
    });

    if (existingBill) {
      return NextResponse.json(existingBill, { status: 200 }); // Return existing
    }

    const body = await req.json();
    let { outletId, shiftId, subtotal, taxAmount, serviceCharge, discount, finalAmount, items, paymentMethod } = body;

    // Handle missing shift constraint for demo purposes
    if (shiftId === "dummy-shift-id") {
      let activeShift = await prisma.managerShift.findFirst({
        where: { outletId, status: "ACTIVE" }
      });
      if (!activeShift) {
        activeShift = await prisma.managerShift.create({
          data: {
            userId: session.user.id,
            outletId,
            status: "ACTIVE"
          }
        });
      }
      shiftId = activeShift.id;
    }

    // Security: Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Bill must contain at least one item" }, { status: 400 });
    }

    // Security: Fetch verified menu item prices from database to prevent price tampering
    const itemIds = items.map((i: any) => i.menuItemId).filter(Boolean);
    const dbItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, price: true, halfPrice: true }
    });
    const priceMap = new Map(dbItems.map((d: any) => [d.id, d]));

    let verifiedSubtotal = 0;
    const validatedItems = items.map((item: any) => {
      const dbItem = priceMap.get(item.menuItemId);
      let realUnitPrice = item.unitPrice || 0;
      const portion = item.portion === "HALF" ? "HALF" : "FULL";
      if (dbItem) {
        if (portion === "HALF" && dbItem.halfPrice != null && dbItem.halfPrice > 0) {
          realUnitPrice = dbItem.halfPrice;
        } else {
          realUnitPrice = dbItem.price;
        }
      }
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const itemSubtotal = realUnitPrice * qty;
      verifiedSubtotal += itemSubtotal;
      return {
        ...item,
        portion,
        quantity: qty,
        unitPrice: realUnitPrice,
        subtotal: itemSubtotal
      };
    });

    // Use verified subtotal
    subtotal = verifiedSubtotal;
    const calculatedFinal = Math.max(0, subtotal + (taxAmount || 0) + (serviceCharge || 0) - (discount || 0));
    finalAmount = calculatedFinal;
    
    // Simplistic bill number generation
    const lastBill = await prisma.bill.findFirst({
      where: { outletId },
      orderBy: { createdAt: 'desc' }
    });
    
    const nextBillNumber = lastBill 
      ? `B-${parseInt(lastBill.billNumber.split('-')[1] || '0') + 1}`
      : `B-1000`;

    const newBill = await prisma.bill.create({
      data: {
        billNumber: nextBillNumber,
        outletId,
        shiftId,
        creatorId: session.user.id,
        subtotal,
        taxAmount,
        serviceCharge,
        discount,
        finalAmount,
        status: "PAID",
        idempotencyKey,
        items: {
          create: validatedItems.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            portion: item.portion || "FULL",
            modifiers: {
              create: item.modifiers?.map((mod: any) => ({
                modifierId: mod.modifierId,
                price: mod.price
              })) || []
            }
          }))
        },
        payments: {
          create: [{
            amount: finalAmount,
            method: paymentMethod || "CASH",
            status: "COMPLETED"
          }]
        }
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: { id: true, name: true, price: true }
            }
          }
        },
        outlet: true,
        creator: true,
        payments: true
      }
    });

    await logAuditAction({
      userId: session.user.id,
      role: session.user.role,
      action: "CREATE_BILL",
      targetType: "BILL",
      targetId: newBill.id,
      details: { billNumber: newBill.billNumber, total: newBill.finalAmount }
    });

    return NextResponse.json(newBill, { status: 201 });
  } catch (error) {
    console.error("Failed to create bill:", error);
    return NextResponse.json({ error: "Failed to create bill" }, { status: 500 });
  }
}
