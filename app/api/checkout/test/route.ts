import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { PaymentMethod, OrderStatus, PaymentStatus, FulfillmentStatus } from "@prisma/client";
import { getStoreIdFromHeadersServer } from "@/lib/store-server";
import { DEFAULT_STORE_ID } from "@/lib/store";
import { safeQuery } from "@/lib/safeQuery";

/**
 * POST /api/checkout/test
 * DEV-only endpoint for creating test orders without Stripe
 * Requires CHECKOUT_MODE=test or NODE_ENV !== "production"
 */
export async function POST(req: Request) {
  // Only allow in development or when CHECKOUT_MODE=test
  const checkoutMode = process.env.CHECKOUT_MODE || (process.env.NODE_ENV === "production" ? "stripe" : "test");
  
  if (checkoutMode !== "test" && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test checkout is not available in production" },
      { status: 403 }
    );
  }

  try {
    const storeId = await getStoreIdFromHeadersServer().catch(() => null);
    const safeStoreId = storeId && storeId !== "demo-store" ? storeId : DEFAULT_STORE_ID;

    const body = await req.json();
    const { items, customer } = body;

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Handlekurven er tom" },
        { status: 400 }
      );
    }

    if (!customer || !customer.email || !customer.fullName) {
      return NextResponse.json(
        { error: "Kundeinformasjon mangler" },
        { status: 400 }
      );
    }

    if (!customer.address1 || !customer.zipCode || !customer.city) {
      return NextResponse.json(
        { error: "Leveringsadresse mangler" },
        { status: 400 }
      );
    }

    // Get or create customer
    let dbCustomer = await safeQuery(
      () =>
        prisma.customer.findFirst({
          where: { email: customer.email, storeId: safeStoreId },
        }),
      null,
      "checkout:test:customer:find"
    );

    if (!dbCustomer) {
      dbCustomer = await safeQuery(
        () =>
          prisma.customer.create({
            data: {
              storeId: safeStoreId,
              email: customer.email,
              name: customer.fullName,
              phone: customer.phone || null,
              addresses: JSON.stringify([
                {
                  address: customer.address1,
                  address2: customer.address2 || "",
                  zip: customer.zipCode,
                  city: customer.city,
                  country: customer.country || "NO",
                },
              ]),
            },
          }),
        null,
        "checkout:test:customer:create"
      );
    }

    if (!dbCustomer) {
      return NextResponse.json(
        { error: "Kunne ikke opprette eller finne kunde" },
        { status: 500 }
      );
    }

    // Fetch products to validate and get prices
    const productIds = items.map((item: any) => item.productId);
    const products = await safeQuery(
      () =>
        prisma.product.findMany({
          where: { id: { in: productIds }, storeId: safeStoreId },
          include: { variants: true },
        }),
      [],
      "checkout:test:products"
    );

    // Build order items
    const orderItemsData: any[] = [];
    const orderItemsCreate: any[] = [];
    let subtotal = 0;

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Produkt ${item.productId} ikke funnet` },
          { status: 404 }
        );
      }

      // Get variant if variantId is provided
      let variant = null;
      if (item.variantId) {
        variant = product.variants.find((v) => v.id === item.variantId);
      }

      const itemPrice = variant ? variant.price : product.price;
      const variantName = item.variantName || variant?.name || null;
      const variantId = item.variantId || null;
      const quantity = item.quantity || 1;
      const lineTotal = itemPrice * quantity;
      subtotal += lineTotal;

      orderItemsData.push({
        productId: item.productId,
        productName: product.name,
        variantId,
        variantName,
        price: itemPrice,
        quantity,
      });

      orderItemsCreate.push({
        productId: item.productId,
        variantId,
        variantName,
        quantity,
        price: itemPrice,
      });
    }

    // Fixed shipping cost: always 99 kr (no free shipping)
    const shippingCost = 99;
    const tax = 0;
    const total = subtotal + shippingCost + tax;

    // Generate order number
    const orderNumber = `ORD-${nanoid(8).toUpperCase()}`;

    // Create order
    const order = await safeQuery(
      () =>
        prisma.order.create({
          data: {
            storeId: safeStoreId,
            orderNumber,
            customerId: dbCustomer.id,
            items: JSON.stringify(orderItemsData),
            subtotal,
            shippingCost,
            tax,
            total,
            shippingAddress: JSON.stringify({
              name: customer.fullName,
              address: customer.address1,
              address2: customer.address2 || "",
              zip: customer.zipCode,
              city: customer.city,
              country: customer.country || "NO",
            }),
            paymentMethod: PaymentMethod.stripe, // Keep for compatibility
            paymentStatus: PaymentStatus.paid, // Mark as paid for test
            status: OrderStatus.pending,
            fulfillmentStatus: FulfillmentStatus.NEW,
            customerEmail: customer.email,
            customerEmailStatus: "NOT_SENT",
            orderItems: {
              create: orderItemsCreate,
            },
          },
          include: {
            orderItems: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        }),
      null,
      "checkout:test:order:create"
    );

    if (!order) {
      return NextResponse.json(
        { error: "Kunne ikke opprette ordre" },
        { status: 500 }
      );
    }

    console.log(`✅ Test order created: ${order.orderNumber} (${order.id})`);

    // Return success with redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const redirectUrl = `${baseUrl}/order-confirmation?orderId=${order.id}&test=true`;

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      redirectUrl,
    });
  } catch (error: any) {
    console.error("❌ Error creating test order:", error);
    return NextResponse.json(
      {
        error: error.message || "Kunne ikke opprette testordre",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

