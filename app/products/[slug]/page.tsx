import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import ProductPageClientWrapper from '@/components/ProductPageClientWrapper';
import ProductVariantSelector from '@/components/ProductVariantSelector';
import AddToCartButton from '@/components/AddToCartButton';
import ProductCard from '@/components/ProductCard';
import ProductTabs from '@/components/ProductTabs';
import ProductPriceDisplay from '@/components/ProductPriceDisplay';
import { Truck, Shield, RotateCcw, Check } from 'lucide-react';
import { cleanProductName } from '@/lib/utils/url-decode';
import { getStoreIdFromHeadersServer } from '@/lib/store-server';
import { DEFAULT_STORE_ID } from '@/lib/store';
import { safeQuery } from '@/lib/safeQuery';
import { SITE_CONFIG } from '@/lib/site';

interface ProductPageProps {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: Promise<{ variant?: string }> | { variant?: string };
}

type VariantDisplay = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  attributes: Record<string, string>;
  stock: number;
  colorCode: string;
  slug: string;
};

async function getParams(params: ProductPageProps["params"]) {
  return params instanceof Promise ? await params : params;
}

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await getParams(params);
  const storeId = await getStoreIdFromHeadersServer();
  
  const product = await safeQuery(
    () =>
      prisma.product.findFirst({
        where: { slug, storeId },
        select: {
          name: true,
          description: true,
          shortDescription: true,
          price: true,
          images: true,
          category: true,
        },
      }),
    null,
    'product:metadata'
  );

  if (!product) {
    return {
      title: 'Produkt ikke funnet | BookBright',
      description: 'Produktet du leter etter ble ikke funnet.',
    };
  }

  // Parse images
  let images: string[] = [];
  try {
    if (typeof product.images === 'string') {
      images = JSON.parse(product.images);
    } else if (Array.isArray(product.images)) {
      images = product.images;
    }
  } catch {
    images = [];
  }

  const cleanedName = cleanProductName(product.name);
  const description = product.shortDescription || product.description?.substring(0, 160) || 'Kjøp produkt hos BookBright';

  const price = Number(product.price);
  const baseUrl = SITE_CONFIG.siteUrl;

  return {
      title: `${cleanedName} | BookBright`,
    description,
    keywords: [cleanedName, product.category || '', 'elektronikk', 'Norge', 'kjøp', 'nettbutikk'],
    openGraph: {
      title: cleanedName,
      description,
      images: images.length > 0 ? [
        {
          url: images[0],
          width: 1200,
          height: 630,
          alt: cleanedName,
        }
      ] : [],
      type: 'website',
      url: `${baseUrl}/products/${slug}`,
      siteName: 'BookBright',
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanedName,
      description,
      images: images.length > 0 ? [images[0]] : [],
    },
    alternates: {
      canonical: `${baseUrl}/products/${slug}`,
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await getParams(params);
  const { variant: variantParam } = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));
  const headerStoreId = await getStoreIdFromHeadersServer();
  const safeStoreId = headerStoreId && headerStoreId !== 'demo-store' ? headerStoreId : DEFAULT_STORE_ID;
  
  // Try multiple strategies to find the product
  let product = null;
  
  // Strategy 1: Try with current storeId and isActive
  product = await safeQuery(
    () =>
      prisma.product.findFirst({
        where: { 
          slug, 
          storeId: safeStoreId,
          isActive: true,
        },
        include: {
          variants: {
            // CRITICAL: Don't filter by isActive - show all variants, mark inactive as disabled in UI
            orderBy: [
              { sortOrder: 'asc' },
              { price: 'asc' },
            ],
          },
        },
      }),
    null,
    'product:detail:strategy1'
  );

  // Strategy 2: If not found, try with DEFAULT_STORE_ID
  if (!product && safeStoreId !== DEFAULT_STORE_ID) {
    product = await safeQuery(
      () =>
        prisma.product.findFirst({
          where: { 
            slug, 
            storeId: DEFAULT_STORE_ID,
            isActive: true,
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
      'product:detail:strategy2'
    );
  }

  // Strategy 3: If still not found, try without storeId filter (find by slug only)
  if (!product) {
    product = await safeQuery(
      () =>
        prisma.product.findFirst({
          where: { 
            slug,
            isActive: true,
            // Exclude demo-store products
            storeId: { not: 'demo-store' },
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
      'product:detail:strategy3'
    );
  }

  // Strategy 4: Last resort - find by slug only (even if inactive, but exclude demo-store)
  if (!product) {
    product = await safeQuery(
      () =>
        prisma.product.findFirst({
          where: { 
            slug,
            storeId: { not: 'demo-store' },
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
      'product:detail:strategy4'
    );
  }


  if (!product) {
    return (
      <main className="min-h-screen bg-slate-50 py-12">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 sm:p-12 text-center shadow-sm border border-gray-200">
            <h1 className="mb-3 text-2xl sm:text-3xl font-bold text-gray-900">Produktet er ikke tilgjengelig</h1>
            <p className="mb-6 text-sm sm:text-base text-gray-600">
              Vi klarte ikke å hente produktdetaljene akkurat nå. Produktet kan ha blitt fjernet eller flyttet.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                Se alle produkter
              </Link>
              <Link
                href="/tilbud"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-900 px-6 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Se tilbud
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Get 3 random related products from same category
  const relatedProducts = await safeQuery(
    async () => {
      const allRelated = await prisma.product.findMany({
        where: {
          category: product.category,
          id: { not: product.id },
          isActive: true,
          storeId: safeStoreId !== 'demo-store' ? safeStoreId : DEFAULT_STORE_ID,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          images: true,
          category: true,
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              attributes: true,
              image: true,
              price: true,
              stock: true,
              sortOrder: true,
            },
            orderBy: { sortOrder: 'asc' },
            take: 5, // Limit to 5 for preview
          },
        },
        take: 20, // Get more to randomize from
      });
      
      // Shuffle and take 3
      const shuffled = allRelated.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 3);
    },
    [],
    'product:related'
  );

  // Parse images with error handling
  // CRITICAL: Collect ALL images from product AND variants
  let images: string[] = [];
  try {
    if (typeof product.images === 'string') {
      images = JSON.parse(product.images);
    } else if (Array.isArray(product.images)) {
      images = product.images;
    }
  } catch (error) {
    images = [];
  }

  // CRITICAL: Add variant images to product images array
  // This ensures all variant images are available for display
  const variantImages = product.variants
    .map((v) => v.image)
    .filter((img): img is string => 
      !!img && 
      typeof img === 'string' &&
      img.startsWith('http') && 
      !img.includes('placeholder') &&
      !img.includes('placehold.co')
    )
    .filter((img: string, idx: number, arr: string[]) => arr.indexOf(img) === idx); // Remove duplicates
  
  // Combine: variant images first (prioritized), then product images
  const imagesSet = new Set<string>();
  [...variantImages, ...images].forEach((img: string) => {
    if (img && typeof img === 'string' && img.length > 0) {
      imagesSet.add(img);
    }
  });
  
  // Preserve order: variant images first, then others
  images = [...variantImages, ...Array.from(imagesSet).filter(img => !variantImages.includes(img))];

  // Parse tags to detect color variants
  let tags: string[] = [];
  try {
    if (typeof product.tags === 'string') {
      tags = JSON.parse(product.tags);
    } else if (Array.isArray(product.tags)) {
      tags = product.tags;
    }
  } catch {
    tags = [];
  }

  // Helper function to get color code
  const getColorCode = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      svart: '#1f2937',
      hvit: '#f9fafb',
      grå: '#6b7280',
      rød: '#ef4444',
      blå: '#3b82f6',
      grønn: '#10b981',
      gul: '#fbbf24',
      rosa: '#ec4894',
      lilla: '#a855f7',
      oransje: '#f97316',
      brun: '#92400e',
      black: '#1f2937',
      white: '#f9fafb',
      gray: '#6b7280',
      grey: '#6b7280',
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#10b981',
      yellow: '#fbbf24',
      pink: '#ec4899',
      purple: '#a855f7',
      orange: '#f97316',
      brown: '#92400e',
    };

    const normalized = colorName.toLowerCase().trim();
    for (const [key, code] of Object.entries(colorMap)) {
      if (normalized.includes(key)) {
        return code;
      }
    }
    return '#94a3b8';
  };

  // Helper function to find image by color name in URL or tags
  const findImageByColor = (color: string, availableImages: string[]): string | null => {
    const normalizedColor = color.toLowerCase().trim();
    
    // Try to find image URL that contains color name
    for (const img of availableImages) {
      const imgLower = img.toLowerCase();
      if (imgLower.includes(normalizedColor)) {
        return img;
      }
    }
    
    // Try matching with color variations
    const colorVariations: Record<string, string[]> = {
      'svart': ['black', 'svart'],
      'hvit': ['white', 'hvit'],
      'grå': ['gray', 'grey', 'grå', 'graa'],
      'rød': ['red', 'rød'],
      'blå': ['blue', 'blå'],
      'grønn': ['green', 'grønn', 'grønn'],
    };
    
    const variations = colorVariations[normalizedColor] || [normalizedColor];
    for (const variation of variations) {
      for (const img of availableImages) {
        if (img.toLowerCase().includes(variation)) {
          return img;
        }
      }
    }
    
    return null;
  };

  // Track used images to ensure uniqueness
  const usedImages = new Set<string>();
  
  // DEBUG: Log variants to ensure they're loaded
  if (process.env.NODE_ENV === 'development') {
    console.log('[ProductPage] Product variants from DB:', {
      productId: product.id,
      productName: product.name,
      variantsExists: !!product.variants,
      variantsIsArray: Array.isArray(product.variants),
      count: product.variants?.length || 0,
      variants: product.variants?.map(v => ({
        id: v.id,
        name: v.name,
        price: v.price,
        isActive: v.isActive,
        image: v.image,
        stock: v.stock,
      })) || [],
    });
  }

  // Map variants with proper images and color codes
  // CRITICAL: Ensure product.variants exists and is an array
  // IMPORTANT: Include ALL variants (even inactive/out of stock) - UI will mark them as disabled
  const productVariants = product.variants || [];
  const variants: VariantDisplay[] = productVariants.map((v, index) => {
    const attrs = (v.attributes as Record<string, string>) || {};
    const color = attrs.color || attrs.farge || v.name.toLowerCase();
    const colorSlug = color.toLowerCase().replace(/\s+/g, '-');
    
    // CRITICAL: Prioritize variant's own image from database, but skip placeholders
    let variantImage = v.image || null;
    
    // Skip placeholder images from variant - they're not useful
    const isPlaceholder = variantImage && (
      variantImage.includes('placeholder') || 
      variantImage.includes('placehold.co') ||
      variantImage.includes('via.placeholder')
    );
    
    if (isPlaceholder) {
      variantImage = null;
    }
    
    // If no valid variant image, try to find one
    if (!variantImage) {
      // Try to find image by color name in URL
      variantImage = findImageByColor(color, images) || null;
      
      if (!variantImage) {
        // Fallback: try to match with tags to find correct image index
        const colorIndex = tags.findIndex((tag: string) => 
          tag.toLowerCase().includes(color.toLowerCase())
        );
        
        if (colorIndex >= 0 && images[colorIndex] && !images[colorIndex].includes('placehold')) {
          variantImage = images[colorIndex];
        } else if (images[index] && !images[index].includes('placehold')) {
          // Use index-based assignment (skip placeholders)
          variantImage = images[index];
        } else {
          // Find first non-placeholder image
          for (let i = 0; i < images.length; i++) {
            if (!images[i].includes('placehold')) {
              variantImage = images[i];
              break;
            }
          }
        }
      }
    }
    
    // Track used images for uniqueness (but allow duplicates if necessary)
    if (variantImage) {
      usedImages.add(variantImage);
    }
    
    return {
      id: v.id,
      name: v.name,
      price: Number(v.price),
      compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
      image: variantImage,
      attributes: attrs,
      stock: v.stock,
      isActive: v.isActive !== false, // Default to true if not set
      colorCode: getColorCode(color),
      slug: colorSlug,
    };
  });

  // Determine active variant from URL parameter
  // Priority: 1) first variant with stock > 0 AND isActive === true, 2) first active variant, 3) first variant
  const defaultVariant = variants.find(v => v.stock > 0 && v.isActive) 
    || variants.find(v => v.isActive) 
    || variants[0];
  const activeVariantSlug = variantParam || defaultVariant?.slug;
  const activeVariant = variants.find((v) => v.slug === activeVariantSlug) || defaultVariant;

  // Reorder images to show active variant first
  // CRITICAL: Ensure variant image is included in images array
  let reorderedImages = [...images];
  if (activeVariant && activeVariant.image) {
    // Filter out placeholder/invalid images
    const validVariantImage = activeVariant.image && 
      activeVariant.image.startsWith('http') && 
      !activeVariant.image.includes('placeholder') &&
      !activeVariant.image.includes('placehold.co');
    
    if (validVariantImage) {
      const variantImageIndex = images.findIndex((img: string) => img === activeVariant.image);
      
      if (variantImageIndex > 0) {
        // Move variant's image to front
        reorderedImages = [
          activeVariant.image,
          ...images.filter((_: string, idx: number) => idx !== variantImageIndex)
        ];
      } else if (variantImageIndex === -1) {
        // If variant image is not in main images array, add it to front
        // This ensures the variant image is always available
        reorderedImages = [activeVariant.image, ...images.filter((img: string) => 
          img !== activeVariant.image && 
          img && 
          img.startsWith('http') &&
          !img.includes('placeholder')
        )];
      } else {
        // Variant image is already first, but ensure it's there
        if (reorderedImages[0] !== activeVariant.image) {
          reorderedImages = [
            activeVariant.image, 
            ...images.filter((img: string) => 
              img !== activeVariant.image && 
              img && 
              img.startsWith('http') &&
              !img.includes('placeholder')
            )
          ];
        }
      }
    } else {
      // Variant image is invalid, filter out placeholders from images
      reorderedImages = images.filter((img: string) => 
        img && 
        img.startsWith('http') &&
        !img.includes('placeholder') &&
        !img.includes('placehold.co')
      );
    }
  } else {
    // No active variant or no variant image, filter out placeholders
    reorderedImages = images.filter((img: string) => 
      img && 
      img.startsWith('http') &&
      !img.includes('placeholder') &&
      !img.includes('placehold.co')
    );
  }

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount && product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) 
    : 0;

  // Clean product name (decode URL-encoded characters)
  const cleanedName = cleanProductName(product.name);

  const productData = {
    id: product.id,
    name: cleanedName,
    slug: product.slug,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    image: images[0] || 'https://placehold.co/600x600?text=Ingen+bilde',
  };

  return (
    <main className="min-h-screen bg-slate-50 py-4 sm:py-6 lg:py-8">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs */}
        <nav className="mb-4 sm:mb-6 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 overflow-x-auto">
          <Link href="/" className="hover:text-gray-900 transition-colors whitespace-nowrap">Hjem</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gray-900 transition-colors whitespace-nowrap">Produkter</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/products?category=${product.category}`} className="hover:text-gray-900 transition-colors whitespace-nowrap">
                {product.category}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-gray-900 truncate">{cleanedName}</span>
        </nav>

        <ProductPageClientWrapper
          images={reorderedImages}
          productName={cleanedName}
          variants={variants}
          defaultImage={productData.image}
          activeVariantSlug={activeVariantSlug}
        >
          {/* Høyre - Produktinfo */}
          <div>
            <div className="rounded-lg sm:rounded-xl bg-white p-4 sm:p-6">
              {/* Badges */}
              <div className="mb-3 sm:mb-4 flex flex-wrap gap-2">
                {hasDiscount && (
                  <span className="rounded-md bg-red-500 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-bold text-white">
                    SPAR {discountPercent}%
                  </span>
                )}
                <span className="rounded-md bg-gray-100 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-700">
                  Tilgjengelig
                </span>
              </div>

              {/* Kategori */}
              <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium uppercase tracking-wide text-gray-500">
                {product.category}
              </p>

              {/* Tittel */}
              <h1 className="mb-4 sm:mb-6 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {cleanedName}
              </h1>

              {/* Pris - dynamisk basert på valgt variant */}
              <ProductPriceDisplay
                basePrice={Number(product.price)}
                baseCompareAtPrice={product.compareAtPrice ? Number(product.compareAtPrice) : null}
                variants={variants}
              />

              {/* Kort beskrivelse */}
              <p className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 leading-relaxed">
                {product.shortDescription || product.description?.substring(0, 200)}
              </p>

              {/* Variant selector - vises før AddToCartButton */}
              {(() => {
                // DEBUG: Log variant state
                if (process.env.NODE_ENV === 'development') {
                  console.log('[ProductPage] Variant check:', {
                    productVariantsLength: product.variants?.length || 0,
                    mappedVariantsLength: variants.length,
                    hasVariants: variants.length > 0,
                    variants: variants.map(v => ({ id: v.id, name: v.name, isActive: true })),
                  });
                }
                
                if (variants.length > 0) {
                  return (
                    <div className="mb-4 sm:mb-6">
                      <div className="mb-2">
                        <label className="text-sm font-semibold text-gray-900">Velg farge:</label>
                      </div>
                      <Suspense fallback={<div className="h-20 w-full rounded-lg bg-gray-200 animate-pulse" />}>
                        <ProductVariantSelector
                          variants={variants}
                          defaultImage={productData.image}
                          variantTypeLabel="Farge"
                        />
                      </Suspense>
                    </div>
                  );
                } else {
                  // Always show debug message in dev, or a subtle message in prod
                  return (
                    <div className={`mb-4 rounded-lg border p-3 text-xs ${
                      process.env.NODE_ENV === 'development' 
                        ? 'bg-yellow-50 border-yellow-200 text-yellow-700' 
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}>
                      {process.env.NODE_ENV === 'development' ? (
                        <>
                          ⚠️ Ingen varianter funnet. Sjekk at varianter er lagt til i admin og at isActive=true.
                          <br />
                          <span className="text-gray-600">
                            Product.variants.length: {product.variants?.length || 0}, 
                            Mapped variants.length: {variants.length}
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-500">Ingen varianter tilgjengelig</span>
                      )}
                    </div>
                  );
                }
              })()}

              {/* Add to cart - only show if no variants OR variant is selected */}
              <AddToCartButton 
                product={productData} 
                variants={variants}
                requireVariantSelection={variants.length > 0}
              />

              {/* Manuell oppfyllelse info */}
              <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-900">
                  <strong>Hva skjer etter betaling?</strong> Ordren behandles manuelt av vårt team. 
                  Du mottar bekreftelse på e-post og sporingsinformasjon når pakken er sendt. 
                  Forventet leveringstid: 5–12 virkedager fra ordrebehandling.
                </p>
              </div>

              {/* USPs */}
              <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-2 sm:gap-4">
                <div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-gray-200 p-2 sm:p-3">
                  <Truck className="text-gray-700 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">Fast frakt</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">99 kr</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-gray-200 p-2 sm:p-3">
                  <RotateCcw className="text-gray-700 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">30 dagers</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Åpent kjøp</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-gray-200 p-2 sm:p-3">
                  <Shield className="text-gray-700 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">2 års garanti</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">Full dekning</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 rounded-lg border border-gray-200 p-2 sm:p-3">
                  <Check className="text-gray-700 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">Tilgjengelig</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">5–12 virkedager</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ProductPageClientWrapper>

        {/* Tabs */}
        <ProductTabs 
          description={product.description || ''} 
          specifications={{}}
        />

        {/* Anbefalte produkter */}
        {relatedProducts.length > 0 && (
          <section className="mt-8 sm:mt-12">
            <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-gray-900">Anbefalte produkter</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((p) => {
                const pImages = typeof p.images === 'string' ? JSON.parse(p.images) : p.images || [];
                return (
                  <ProductCard 
                    key={p.id} 
                    product={{
                      id: p.id,
                      name: p.name,
                      slug: p.slug,
                      price: Number(p.price),
                      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
                      images: pImages,
                      category: p.category,
                    }} 
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
