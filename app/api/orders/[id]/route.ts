import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safeQuery";

/**
 * GET /api/orders/[id]
 * Public endpoint for fetching order details (for order confirmation page)
 * Used for test orders and Stripe redirects
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await context.params;

    if (!orderId || orderId.trim() === "") {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    const order = await safeQuery(
      () =>
        prisma.order.findUnique({
          where: { id: orderId.trim() },
          include: {
            customer: {
              select: {
                name: true,
                email: true,
              },
            },
            orderItems: {
              include: {
                product: {
                  select: {
                    name: true,
                    images: true,
                  },
                },
                variant: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        }),
      null,
      "orders:public:get"
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Parse items from JSON or use orderItems
    let items: any[] = [];
    try {
      if (typeof order.items === "string") {
        const parsed = JSON.parse(order.items);
        items = Array.isArray(parsed) ? parsed : [];
      } else if (order.items && Array.isArray(order.items)) {
        items = order.items;
      }
    } catch {
      // Fallback to orderItems
      items = order.orderItems.map((item) => {
        // Parse product images
        let productImages: string[] = [];
        try {
          if (typeof item.product.images === "string") {
            productImages = JSON.parse(item.product.images);
          } else if (Array.isArray(item.product.images)) {
            productImages = item.product.images;
          }
        } catch {
          productImages = [];
        }

        return {
          productId: item.productId,
          name: item.product.name,
          price: item.price,
          quantity: item.quantity,
          variantId: item.variantId || undefined,
          variantName: item.variantName || item.variant?.name || undefined,
          image: productImages[0] || undefined,
        };
      });
    }

    // Parse shipping address
    let shippingAddress = {};
    try {
      if (typeof order.shippingAddress === "string") {
        shippingAddress = JSON.parse(order.shippingAddress);
      } else if (order.shippingAddress) {
        shippingAddress = order.shippingAddress;
      }
    } catch {
      shippingAddress = {};
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer
          ? {
              name: order.customer.name || "Kunde",
              email: order.customer.email || order.customerEmail || "",
            }
          : {
              name: "Kunde",
              email: order.customerEmail || "",
            },
        items,
        shippingAddress,
        total: order.total,
        subtotal: order.subtotal,
        shippingCost: order.shippingCost,
        tax: order.tax,
        paymentStatus: order.paymentStatus,
        status: order.status,
        fulfillmentStatus: order.fulfillmentStatus,
        supplierOrderStatus: order.supplierOrderStatus,
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
