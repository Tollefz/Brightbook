'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { cleanProductName } from '@/lib/utils/url-decode';
import { getCategoryByDbValue } from '@/lib/categories';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: any;
  variants?: Array<{
    id: string;
    name: string;
    attributes?: Record<string, string>;
    colorCode?: string;
    stock?: number;
    sortOrder?: number;
  }>;
}

function ProductCard({ product, variants = [] }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  // KRITISK: Parse images fra JSON string med error handling
  // Støtter både images (JSON array) og imageUrl (single string)
  let images: string[] = [];
  try {
    if (typeof product.images === 'string') {
      // Try to parse as JSON array
      try {
        const parsed = JSON.parse(product.images);
        images = Array.isArray(parsed) ? parsed : [];
      } catch {
        // If not valid JSON, treat as single URL string
        if (product.images && product.images.startsWith('http')) {
          images = [product.images];
        }
      }
    } else if (Array.isArray(product.images)) {
      images = product.images;
    }
  } catch (error) {
    images = [];
  }

  // Check for imageUrl field (if product has it)
  const imageUrl = (product as any).imageUrl;

  // Valider at bildene er gyldige URLs
  const isValidUrl = (url: string) => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return url.startsWith('http') && !url.includes('placehold.co');
    } catch {
      return false;
    }
  };

  // Filtrer ut ugyldige bilder og placeholders
  const validImages = images.filter(img => isValidUrl(img));
  
  // Prioritize: imageUrl > images[0] > fallback
  // Fallback hvis ingen bilder
  const fallbackImage = 'https://placehold.co/400x400/f5f5f5/666666?text=Produkt';
  const primaryImage = 
    (imageUrl && isValidUrl(imageUrl)) 
      ? imageUrl 
      : (validImages[0] || fallbackImage);
  const mainImage = primaryImage;
  const hoverImage = validImages[1] || mainImage; // Hvis ingen andre bilder, bruk samme
  
  // Clean product name (decode URL-encoded characters)
  const cleanedName = cleanProductName(product.name);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Find default variant: first with stock > 0, or first variant, sorted by sortOrder
    let defaultVariant = null;
    if (variants && variants.length > 0) {
      const sortedVariants = [...variants].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      defaultVariant = sortedVariants.find((v: any) => v.stock > 0) || sortedVariants[0];
    }
    
    // Build variant query if variant exists
    let variantQuery = '';
    if (defaultVariant) {
      const color = defaultVariant.attributes?.color || defaultVariant.attributes?.farge || defaultVariant.name?.toLowerCase() || '';
      const variantSlug = color.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      variantQuery = `?variant=${variantSlug}`;
    }
    
    // Navigate to PDP (always, never directly to checkout)
    router.push(`/products/${product.slug}${variantQuery}`);
  };

  // Beregn rabatt
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.price / product.compareAtPrice) * 100) 
    : 0;

  return (
    <Link 
      href={`/products/${product.slug}`}
      className="group block h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-premium transition-all duration-300 hover:shadow-premium-hover">
        
        {/* Badges */}
        {(hasDiscount || product.isNew) && (
          <div className="absolute left-2 top-2 z-10 flex flex-col gap-1.5 sm:left-3 sm:top-3">
            {hasDiscount && (
              <span className="rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white shadow-sm">
                -{discountPercent}%
              </span>
            )}
            {product.isNew && (
              <span className="rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-sm">
                NYHET
              </span>
            )}
          </div>
        )}

        {/* Wishlist button - kun på desktop */}
        <button 
          className="absolute right-2 top-2 z-10 hidden rounded-full bg-white p-2 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-gray-50 sm:right-3 sm:top-3 sm:block"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <Heart size={16} className="text-gray-600 hover:text-red-500" />
        </button>

        {/* Image container med hover-effekt */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 group-hover:bg-gray-100 transition-colors duration-300">
          {/* Hovedbilde */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            isHovered && hoverImage !== mainImage ? 'opacity-0' : 'opacity-100'
          }`}>
            <Image
              src={imageError ? fallbackImage : mainImage}
              alt={cleanedName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-contain p-3 sm:p-4"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          </div>
          
          {/* Hover-bilde (kun hvis forskjellig) */}
          {hoverImage !== mainImage && (
            <div className={`absolute inset-0 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <Image
                src={hoverImage}
                alt={`${cleanedName} - alternativt bilde`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain p-3 sm:p-4"
                loading="lazy"
                onError={() => {
                  // Hvis hover-bilde feiler, vis hovedbilde
                  setIsHovered(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4 sm:p-5">
          {/* Kategori */}
          <p className="mb-1 text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-500">
            {(() => {
              const categoryDef = getCategoryByDbValue(product.category);
              return categoryDef?.label || product.category || 'Elektronikk';
            })()}
          </p>

          {/* VariantDebug - dev only */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="absolute top-1 right-1 bg-yellow-100 text-yellow-800 text-[8px] px-1 py-0.5 rounded z-10">
              V:{variants?.length || 0}
            </div>
          )}

          {/* Variant swatches - vises hvis produkt har varianter */}
          {variants && variants.length > 0 && (() => {
            // Helper function to get color code from variant name/attributes
            const getColorCode = (colorName: string): string => {
              const colorMap: Record<string, string> = {
                svart: '#1f2937', hvit: '#f9fafb', grå: '#6b7280', rød: '#ef4444',
                blå: '#3b82f6', grønn: '#10b981', gul: '#fbbf24', rosa: '#ec4894',
                lilla: '#a855f7', oransje: '#f97316', brun: '#92400e',
                black: '#1f2937', white: '#f9fafb', gray: '#6b7280', grey: '#6b7280',
                red: '#ef4444', blue: '#3b82f6', green: '#10b981', yellow: '#fbbf24',
                pink: '#ec4899', purple: '#a855f7', orange: '#f97316', brown: '#92400e',
              };
              const normalized = colorName.toLowerCase().trim();
              for (const [key, code] of Object.entries(colorMap)) {
                if (normalized.includes(key)) return code;
              }
              return '#94a3b8';
            };

            return (
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] sm:text-xs text-gray-500">Farger:</span>
                {variants.slice(0, 3).map((variant) => {
                  const color = variant.attributes?.color || variant.attributes?.farge || variant.name.toLowerCase();
                  const colorSlug = color.toLowerCase().replace(/\s+/g, '-');
                  const colorCode = variant.colorCode || getColorCode(color);
                  return (
                    <Link
                      key={variant.id}
                      href={`/products/${product.slug}?variant=${colorSlug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="group/variant relative"
                      title={`Velg ${variant.name}`}
                    >
                      <div
                        className="h-5 w-5 rounded-full border border-gray-300 shadow-sm transition-all hover:scale-110 hover:border-gray-900 hover:shadow-md"
                        style={{ backgroundColor: colorCode }}
                        aria-label={variant.name}
                      />
                    </Link>
                  );
                })}
                {variants.length > 3 && (
                  <span className="text-[10px] sm:text-xs text-gray-500">
                    +{variants.length - 3}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Produktnavn */}
          <h3 className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm sm:text-base font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
            {cleanedName}
          </h3>


          {/* Pris */}
          <div className="mb-3 sm:mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-gray-900">
                {Math.floor(product.price).toLocaleString('no-NO')},-
              </span>
            </div>
            {hasDiscount && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-400 line-through">
                  {Math.floor(product.compareAtPrice).toLocaleString('no-NO')},-
                </span>
                <span className="rounded-full bg-gray-900 px-2 py-1 text-xs font-medium text-white">
                  -{discountPercent}%
                </span>
              </div>
            )}
          </div>

          {/* Kjøp nå knapp - navigerer til PDP, ikke checkout */}
          <button
            onClick={handleBuyNow}
            className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 sm:py-3.5 text-sm font-medium text-white transition-all hover:bg-gray-800 active:scale-[0.98] shadow-premium hover:shadow-premium-hover focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
          >
            <ShoppingCart size={16} />
            <span>Kjøp nå</span>
          </button>

          {/* Leveringsinfo - skjul på mobil */}
          <p className="mt-2 hidden text-center text-xs font-medium text-gray-600 sm:block">
            Tilgjengelig – 5–12 virkedager
          </p>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
export { ProductCard };
