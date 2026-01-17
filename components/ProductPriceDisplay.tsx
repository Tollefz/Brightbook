'use client';

import { useContext, useMemo } from 'react';
import { VariantContext } from './ProductPageClientWrapper';

interface ProductPriceDisplayProps {
  basePrice: number;
  baseCompareAtPrice?: number | null;
  variants?: Array<{
    id: string;
    price: number;
    compareAtPrice?: number | null;
  }>;
}

export default function ProductPriceDisplay({ 
  basePrice, 
  baseCompareAtPrice,
  variants = []
}: ProductPriceDisplayProps) {
  const variantContext = useContext(VariantContext);
  const selectedVariant = variantContext?.selectedVariant || null;

  // Calculate display price based on selected variant
  const displayPrice = useMemo(() => {
    return selectedVariant ? selectedVariant.price : basePrice;
  }, [selectedVariant, basePrice]);

  const displayCompareAtPrice = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.compareAtPrice || null;
    }
    return baseCompareAtPrice || null;
  }, [selectedVariant, baseCompareAtPrice]);

  const hasDiscount = displayCompareAtPrice && displayCompareAtPrice > displayPrice;
  const discountAmount = hasDiscount ? displayCompareAtPrice! - displayPrice : 0;
  const discountPercent = hasDiscount 
    ? Math.round((discountAmount / displayCompareAtPrice!) * 100)
    : 0;

  return (
    <div className="mb-4 sm:mb-6 rounded-lg bg-gray-50 p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
        <span 
          id="product-price-display"
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900"
        >
          {Math.floor(displayPrice).toLocaleString('no-NO')},-
        </span>
        {hasDiscount && (
          <span className="text-lg sm:text-xl text-gray-500 line-through">
            {Math.floor(displayCompareAtPrice!).toLocaleString('no-NO')},-
          </span>
        )}
      </div>
      {hasDiscount && (
        <p className="mt-1 text-xs sm:text-sm font-semibold text-red-600">
          Du sparer {Math.floor(discountAmount).toLocaleString('no-NO')},-
        </p>
      )}
      <p className="mt-2 text-xs text-gray-500">Inkl. mva</p>
      {variants.length > 0 && selectedVariant && (
        <p className="mt-1 text-xs text-gray-500 italic">
          Pris for {selectedVariant.name}
        </p>
      )}
    </div>
  );
}

