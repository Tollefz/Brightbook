import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { sendOrderToSupplier } from "@/lib/dropshipping/send-order-to-supplier";
import { prisma } from "@/lib/prisma";
import { SupplierOrderStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    // Get order before sending to capture old status and supplier name
    const orderBefore = await prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                supplierName: true,
              },
            },
          },
        },
      },
    });

    if (!orderBefore) {
      return NextResponse.json(
        { error: "Ordre ikke funnet" },
        { status: 404 }
      );
    }

    // Get supplier name from first order item, or default to "TEMU"
    const supplierName = orderBefore.orderItems[0]?.product?.supplierName?.toUpperCase() || "TEMU";

    // Send order to supplier (this updates supplierOrderStatus and supplierOrderId)
    await sendOrderToSupplier(id);

    // Fetch updated order to return current state
    const updatedOrder = await prisma.order.findUnique({
      where: { id },
      select: {
        supplierOrderStatus: true,
        supplierOrderId: true,
        updatedAt: true,
      },
    });

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Ordre ikke funnet etter sending" },
        { status: 404 }
      );
    }

    // Generate supplier order reference (e.g., "TEMU-<supplierOrderId>")
    const supplierOrderRef = updatedOrder.supplierOrderId 
      ? `${supplierName}-${updatedOrder.supplierOrderId}` 
      : updatedOrder.supplierOrderId || null;

    return NextResponse.json({
      ok: true,
      data: {
        supplierStatus: updatedOrder.supplierOrderStatus,
        supplierOrderRef,
        supplierSentAt: updatedOrder.updatedAt,
        supplierOrderId: updatedOrder.supplierOrderId,
        supplierProvider: supplierName,
      },
    });
  } catch (error: any) {
    console.error("[send-to-supplier] Error:", error);
    return NextResponse.json(
      { 
        ok: false,
        error: error?.message || "Kunne ikke sende ordre til leverandør" 
      },
      { status: 500 }
    );
  }
}

