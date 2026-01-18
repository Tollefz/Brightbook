import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { improveTitle } from '@/lib/utils/improve-product-title';
import { safeQuery } from '@/lib/safeQuery';
import { logError } from '@/lib/utils/logger';
import { revalidatePath } from 'next/cache';

// Force dynamic rendering to allow revalidation
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    
    // Log query for debugging (dev only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[api/admin/products/[id]] Fetching product with id:', id);
    }
    
    const product = await safeQuery(
      () =>
        prisma.product.findUnique({
          where: { id },
          include: {
            variants: true,
          },
        }),
      null,
      'admin:product:get'
    );

    if (!product) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[api/admin/products/[id]] Product not found for id:', id);
      }
      return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 });
    }

    // Log product data for debugging (dev only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[api/admin/products/[id]] Product found:', {
        id: product.id,
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        supplierPrice: product.supplierPrice,
        category: product.category,
        hasDescription: !!product.description,
        hasShortDescription: !!product.shortDescription,
        hasImages: !!product.images,
        hasTags: !!product.tags,
        stock: product.stock,
        sku: product.sku,
        slug: product.slug,
      });
    }

    return NextResponse.json({ ok: true, data: product });
  } catch (error) {
    logError(error, '[api/admin/products/[id]] GET');
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await req.json();
    const { images, name, ...otherFields } = body;

    const updateData: any = { ...otherFields };
    if (images !== undefined) {
      // Handle both string (JSON) and array formats
      updateData.images = typeof images === "string" ? images : JSON.stringify(images || []);
    }
    
    // Forbedre produkt-tittel automatisk hvis name oppdateres
    if (name) {
      updateData.name = improveTitle(name);
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        variants: true,
      },
    });

    // CRITICAL: Revalidate product pages and homepage to show updated variants
    try {
      revalidatePath('/');
      revalidatePath('/products');
      revalidatePath(`/products/${product.slug}`);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[revalidate] Revalidated paths for product: ${product.slug}`);
      }
    } catch (revalidateError) {
      // Non-critical: log but don't fail the request
      console.warn('[revalidate] Failed to revalidate paths:', revalidateError);
    }

    return NextResponse.json({ ok: true, data: product });
  } catch (error) {
    logError(error, '[api/admin/products/[id]] PATCH');
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    
    // Check if product exists
    const product = await safeQuery(
      () =>
        prisma.product.findUnique({
          where: { id },
          include: {
            variants: true,
            orderItems: true,
          },
        }),
      null,
      'admin:product:delete'
    );

    if (!product) {
      return NextResponse.json(
        { ok: false, error: 'Produkt ikke funnet' },
        { status: 404 }
      );
    }

    // Check if product has associated orders
    if (product.orderItems.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Kan ikke slette produkt som har tilknyttede ordre. Deaktiver produktet i stedet.' },
        { status: 400 }
      );
    }

    // Delete variants first (cascade)
    if (product.variants.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { productId: id },
      });
    }

    // Delete the product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json(
      { ok: true, message: 'Produkt slettet' },
      { status: 200 }
    );
  } catch (error) {
    logError(error, '[api/admin/products/[id]] DELETE');
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Kunne ikke slette produkt' },
      { status: 500 }
    );
  }
}