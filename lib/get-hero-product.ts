import { prisma } from "@/lib/prisma";
import { safeQuery } from "@/lib/safeQuery";
import type { Product } from "@prisma/client";

export interface HeroProductResult {
  product: Product | null;
  source: 'isHero' | 'newest' | 'none';
  error?: string;
}

/**
 * Get hero product with fallback logic:
 * 1. Try to find product with isHero=true and isActive=true
 * 2. If not found, fallback to newest active product
 * 3. If still not found, return null
 * 
 * This ensures the homepage always has a product to display if any products exist,
 * and gracefully handles the case when no products exist yet.
 * 
 * Never throws - always returns a result with source and optional error.
 */
export async function getHeroProduct(): Promise<HeroProductResult> {
  // Strategy 1: Try to find explicitly marked hero product
  let heroProduct: Product | null = null;
  let strategy1Error: string | undefined = undefined;
  
  try {
    heroProduct = await safeQuery(
      () => prisma.product.findFirst({
        where: { 
          isHero: true, 
          isActive: true,
          // Ensure product has stock or at least one active variant with stock
          // OR condition: product has stock > 0 OR has at least one variant with stock > 0
          OR: [
            { stock: { gt: 0 } },
            { variants: { some: { isActive: true, stock: { gt: 0 } } } },
          ],
        },
        include: {
          variants: {
            where: { isActive: true },
            orderBy: [
              { sortOrder: 'asc' },
              { price: 'asc' },
            ],
          },
        },
      }),
      null,
      'getHeroProduct:strategy1:isHero'
    );
  } catch (error: any) {
    // safeQuery should never throw, but catch just in case
    strategy1Error = error?.message || 'Unknown error in strategy1';
    console.error('Unexpected error in getHeroProduct strategy1:', error);
  }

  if (heroProduct) {
    return {
      product: heroProduct,
      source: 'isHero',
      ...(strategy1Error && { error: strategy1Error }),
    };
  }

  // Strategy 2: Fallback to newest active product
  let fallbackProduct: Product | null = null;
  let strategy2Error: string | undefined = undefined;
  
  try {
    fallbackProduct = await safeQuery(
      () => prisma.product.findFirst({
        where: { 
          isActive: true,
          // Ensure product has stock or at least one active variant with stock
          // OR condition: product has stock > 0 OR has at least one variant with stock > 0
          OR: [
            { stock: { gt: 0 } },
            { variants: { some: { isActive: true, stock: { gt: 0 } } } },
          ],
        },
        orderBy: { 
          createdAt: 'desc' 
        },
        include: {
          variants: {
            where: { isActive: true },
            orderBy: [
              { sortOrder: 'asc' },
              { price: 'asc' },
            ],
          },
        },
      }),
      null,
      'getHeroProduct:strategy2:newest'
    );
  } catch (error: any) {
    // safeQuery should never throw, but catch just in case
    strategy2Error = error?.message || 'Unknown error in strategy2';
    console.error('Unexpected error in getHeroProduct strategy2:', error);
  }

  if (fallbackProduct) {
    return {
      product: fallbackProduct,
      source: 'newest',
      ...(strategy2Error && { error: strategy2Error }),
    };
  }

  // No product found
  return {
    product: null,
    source: 'none',
    error: strategy1Error || strategy2Error || 'No active products found',
  };
}

