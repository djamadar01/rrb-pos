import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, currency } = await req.json();

    // In a real application, you would initialize the Razorpay SDK and create an order here.
    // e.g.
    // const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY, key_secret: ... });
    // const order = await razorpay.orders.create({ amount, currency, receipt: "rcptid_11" });

    // Mock response
    const mockOrder = {
      id: `order_${Date.now()}`,
      entity: "order",
      amount,
      amount_paid: 0,
      amount_due: amount,
      currency: currency || "INR",
      receipt: "receipt_mock_11",
      offer_id: null,
      status: "created",
      attempts: 0,
      notes: [],
      created_at: Math.floor(Date.now() / 1000),
    };

    return NextResponse.json(mockOrder, { status: 201 });
  } catch (error) {
    console.error("Failed to create mock Razorpay order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
