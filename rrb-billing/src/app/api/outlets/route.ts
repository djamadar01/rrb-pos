import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const outlets = await prisma.outlet.findMany({
      include: {
        shifts: {
          where: { status: "ACTIVE" },
          take: 1
        }
      }
    });

    return NextResponse.json(outlets);
  } catch (error) {
    console.error("Failed to fetch outlets:", error);
    return NextResponse.json({ error: "Failed to fetch outlets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, location, contactInfo, taxConfiguration } = await req.json();

    if (!name || !location || !contactInfo) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newOutlet = await prisma.outlet.create({
      data: {
        name,
        location,
        contactInfo,
        taxConfiguration: taxConfiguration || JSON.stringify({ taxRate: 5, serviceCharge: 0 })
      }
    });

    return NextResponse.json(newOutlet);
  } catch (error) {
    console.error("Failed to create outlet:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, name, location, contactInfo, taxConfiguration } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Outlet ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;
    if (contactInfo !== undefined) updateData.contactInfo = contactInfo;
    if (taxConfiguration !== undefined) updateData.taxConfiguration = taxConfiguration;

    const updatedOutlet = await prisma.outlet.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedOutlet);
  } catch (error) {
    console.error("Failed to update outlet:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.outlet.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete outlet:", error);
    if (error.code === 'P2003') {
      return NextResponse.json({ error: "Cannot delete this Outlet because it has billing history. Please change its details or ignore it to preserve historical records." }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
