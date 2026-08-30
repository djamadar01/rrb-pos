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

    // We should ideally calculate subtotal and tax on the server to prevent tampering,
    // but for simplicity in this demo we'll accept them and just record them.
    // Ensure billNumber is generated safely (e.g., sequentially per outlet)
    
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
          create: items.map((item: any) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
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
            menuItem: true
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
