'use client';

import { useState, useMemo, useEffect, useContext, useRef } from 'react';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Check } from 'lucide-react';
import { VariantContext } from './ProductPageClientWrapper';

interface Variant {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string | null;
  attributes: Record<string, string>;
  stock: number;
  isActive?: boolean;
  slug?: string;
  colorCode?: string;
}

interface ProductVariantSelectorProps {
  variants: Variant[];
  defaultImage: string;
  onVariantChange?: (variant: Variant | null, variantImage: string | null) => void;
  variantTypeLabel?: string;
}

export default function ProductVariantSelector({ 
  variants, 
  defaultImage, 
  onVariantChange,
  variantTypeLabel = 'Farge'
}: ProductVariantSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // DEBUG: Log when component renders
  if (process.env.NODE_ENV === 'development') {
    console.log('[ProductVariantSelector] Rendering with:', {
      variantsCount: variants?.length || 0,
      variantsIsArray: Array.isArray(variants),
      variantIds: variants?.map(v => ({ id: v.id, name: v.name })) || [],
    });
  }

  // Get initial variant from URL or default - also update when URL changes
  // Priority: 1) URL param, 2) First variant with stock > 0 AND isActive, 3) First active variant, 4) First variant
  const initialVariantSlug = searchParams.get('variant');
  const initialVariantFromUrl = initialVariantSlug 
    ? variants.find((v) => v.slug === initialVariantSlug)
    : null;
  
  const initialVariant = initialVariantFromUrl 
    || variants.find((v) => v.stock > 0 && v.isActive !== false) 
    || variants.find((v) => v.isActive !== false)
    || variants[0];

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    initialVariant?.id || (variants.length > 0 ? variants[0].id : null)
  );
  
  // Track if user just clicked (to avoid URL sync overriding user selection)
  const userClickRef = useRef<{ variantId: string; timestamp: number } | null>(null);

  // Update selected variant when URL changes externally (user navigated or shared link)
  // But only if user didn't just click (to avoid overriding user selection)
  useEffect(() => {
    // Ignore URL changes if user just clicked within last 500ms
    const recentClick = userClickRef.current && (Date.now() - userClickRef.current.timestamp) < 500;
    if (recentClick && userClickRef.current?.variantId === selectedVariantId) {
      return; // User just clicked this variant, don't override
    }
    
    if (initialVariantSlug && initialVariant && initialVariant.id !== selectedVariantId) {
      // URL changed externally - sync with it
      setSelectedVariantId(initialVariant.id);
      console.log(`[VariantSelector] 📍 Synced with URL variant: ${initialVariantSlug}`);
    }
  }, [initialVariantSlug]); // Only react to URL slug changes, not internal state
  
  // Try to use context if available (when used within ProductPageVariantWrapper)
  const variantContext = useContext(VariantContext);

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) || null,
    [variants, selectedVariantId]
  );

  // Update variant image and URL when variant changes - BUT only if it's a real change
  useEffect(() => {
    if (!selectedVariant) return;
    
    // Check if this variant is already selected in URL to avoid loops
    const currentUrlVariant = searchParams.get('variant');
    if (selectedVariant.slug === currentUrlVariant) {
      // Already in sync, just update context
      const variantImage = selectedVariant.image || defaultImage || null;
      if (variantContext) {
        variantContext.setSelectedVariantImage(variantImage);
        variantContext.setSelectedVariant(selectedVariant);
      }
      return;
    }
    
    const variantImage = selectedVariant.image || defaultImage || null;
    
    // Update via context if available - THIS IS CRITICAL
    if (variantContext) {
      // Force immediate update - don't wait for React batching
      variantContext.setSelectedVariantImage(variantImage);
      variantContext.setSelectedVariant(selectedVariant);
    }
    
    // Update URL with variant parameter (only if different)
    if (selectedVariant.slug && selectedVariant.slug !== currentUrlVariant) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('variant', selectedVariant.slug);
      // Use replace instead of push to avoid adding to history
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      console.log(`[VariantSelector] ✅ Updated URL to: ?variant=${selectedVariant.slug}`);
    }
    
    // Also call callback if provided (for backwards compatibility)
    if (onVariantChange) {
      onVariantChange(selectedVariant, variantImage);
    }
  }, [selectedVariant?.id, selectedVariant?.slug, defaultImage, variantContext, onVariantChange, router, pathname, searchParams]);

  // Grupper varianter etter attributt (farge, størrelse, etc)
  const variantGroups = useMemo(() => {
    const groups: Record<string, Variant[]> = {};
    variants.forEach((variant) => {
      const key = variant.attributes?.color || variant.attributes?.farge || variant.attributes?.størrelse || variant.name.split(' - ')[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(variant);
    });
    return groups;
  }, [variants]);

  if (!variants || variants.length === 0) {
    // DEBUG: Log why variants are not showing
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ProductVariantSelector] No variants provided:', {
        variants: variants,
        variantsLength: variants?.length || 0,
        variantsIsArray: Array.isArray(variants),
      });
    }
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-900">
          {variantTypeLabel}:
        </label>
        {selectedVariant && (
          <span className="text-xs text-gray-500">
            Valgt: {selectedVariant.attributes?.color || selectedVariant.attributes?.farge || selectedVariant.name.split(' - ')[0] || selectedVariant.name}
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const isSelected = selectedVariantId === variant.id;
          // Prioritize variant's own image, fallback to default
          const variantImage = variant.image || defaultImage;
          const variantLabel = variant.attributes?.color || variant.attributes?.farge || variant.attributes?.størrelse || variant.name.split(' - ')[0] || variant.name;
          
          // Determine if variant is disabled
          const isActive = variant.isActive !== false; // Default to true if not set
          const isOutOfStock = variant.stock <= 0;
          const isDisabled = !isActive || isOutOfStock;
          const disabledReason = !isActive ? 'Ikke tilgjengelig' : isOutOfStock ? 'Utsolgt' : null;
          
          return (
            <button
              key={variant.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Don't allow selection of disabled variants
                if (isDisabled) {
                  return;
                }
                
                // Track user click to prevent URL sync from overriding
                userClickRef.current = { variantId: variant.id, timestamp: Date.now() };
                
                setSelectedVariantId(variant.id);
                
                // CRITICAL: Immediately update context when clicked to trigger image change
                // This must happen synchronously, not in useEffect
                if (variantContext) {
                  const variantImageToUse = variant.image || defaultImage || null;
                  // Force immediate synchronous update - this will trigger re-render
                  variantContext.setSelectedVariantImage(variantImageToUse);
                  variantContext.setSelectedVariant(variant);
                  console.log(`[VariantSelector] ✅ Clicked variant: ${variantLabel}`);
                  console.log(`[VariantSelector] Image: ${variantImageToUse?.substring(0, 80)}...`);
                }
              }}
              disabled={isDisabled}
              className={`group relative flex flex-col items-center rounded-lg border-2 overflow-hidden transition-all ${
                isDisabled
                  ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'border-gray-900 ring-2 ring-gray-900/10 shadow-premium'
                  : 'border-gray-300 hover:border-gray-900 hover:shadow-sm'
              }`}
              aria-label={`Velg ${variantLabel}${disabledReason ? ` (${disabledReason})` : ''}`}
              title={disabledReason || undefined}
            >
              {/* Variant bilde - unikt for hver variant */}
              <div className="relative w-24 h-24 bg-gray-100">
                {variantImage ? (
                  <Image
                    src={variantImage}
                    alt={`${variantLabel} variant`}
                    fill
                    sizes="96px"
                    className="object-contain p-2"
                    unoptimized={variantImage.includes('.avif')}
                    onError={(e) => {
                      console.warn(`[VariantSelector] Image failed to load: ${variantImage}`);
                      const target = e.target as HTMLImageElement;
                      if (target) {
                        target.style.display = 'none';
                      }
                    }}
                  />
                ) : variant.colorCode ? (
                  // Show color swatch if no image but has color code
                  <div 
                    className="w-full h-full rounded"
                    style={{ backgroundColor: variant.colorCode }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    {variantLabel}
                  </div>
                )}
              </div>
              
              {/* Variant navn */}
              <div className={`w-full px-2 py-1.5 text-xs font-medium text-center transition-colors ${
                isDisabled 
                  ? 'bg-gray-50 text-gray-400' 
                  : isSelected 
                  ? 'bg-gray-50 text-gray-900' 
                  : 'bg-white text-gray-900'
              }`}>
                {variantLabel}
                {disabledReason && (
                  <span className="block text-[10px] text-red-600 font-medium mt-0.5">
                    {disabledReason}
                  </span>
                )}
              </div>
              
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-900 border-2 border-white flex items-center justify-center shadow-sm z-10">
                  <Check size={12} className="text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
