'use client';

import { useState, useMemo, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, Minus, Plus, Check } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import toast from 'react-hot-toast';
import { VariantContext } from './ProductPageClientWrapper';

interface Variant {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  image?: string | null;
  attributes: Record<string, string>;
  stock: number;
}

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    image: string;
  };
  variants?: Variant[];
  onVariantChange?: (variant: Variant | null) => void;
}

export default function AddToCartButton({ product, variants = [], onVariantChange, requireVariantSelection = false }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();
  const router = useRouter();
  
  // Try to use VariantContext if available (when used within ProductPageClientWrapper)
  const variantContext = useContext(VariantContext);
  
  // Use variant from context if available, otherwise use first variant as default
  const selectedVariant = variantContext?.selectedVariant || (variants.length > 0 ? variants[0] : null);
  const selectedVariantId = selectedVariant?.id || null;

  const hasVariants = variants.length > 0;

  // Notify parent when variant changes
  useEffect(() => {
    if (onVariantChange) {
      onVariantChange(selectedVariant);
    }
  }, [selectedVariant, onVariantChange]);

  // Require variant selection if product has variants and requireVariantSelection is true
  const isVariantRequired = requireVariantSelection && hasVariants && !selectedVariant;
  const isAddToCartDisabled = isLoading || added || isVariantRequired;

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayCompareAtPrice = selectedVariant
    ? selectedVariant.compareAtPrice
    : product.compareAtPrice;
  const displayImage = selectedVariant?.image || product.image;

  const handleAddToCart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // CRITICAL: Ensure variant is selected if product has variants
      if (hasVariants && !selectedVariant) {
        setError('Velg farge før du legger produkt i handlekurv');
        setIsLoading(false);
        return;
      }
      
      const itemToAdd = {
        productId: product.id,
        name: product.name,
        price: displayPrice,
        image: displayImage,
        quantity: 1, // Will be handled by addToCart
        slug: product.slug,
        variantId: selectedVariant?.id || undefined,
        variantName: selectedVariant?.name || undefined,
      };

      addToCart(itemToAdd, quantity);
      setAdded(true);
      toast.success(`${product.name} lagt i handlekurv!`, {
        icon: '🛒',
      });
      setTimeout(() => setAdded(false), 2000);
      // NOTE: "Legg i handlekurv" does NOT navigate to checkout - only "Kjøp nå" does
    } catch (err) {
      setError('Kunne ikke legge produkt i handlekurv. Prøv igjen.');
      console.error('Error adding to cart:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">

      {/* Antall velger */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-dark">Antall:</span>
        <div className="flex items-center rounded-lg border border-gray-border">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-3 hover:bg-gray-light transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="w-12 text-center font-semibold">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-3 hover:bg-gray-light transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Variant required message */}
      {isVariantRequired && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
          Velg farge før du legger produkt i handlekurv
        </div>
      )}

      {/* Legg i handlekurv knapp */}
      <button
        onClick={handleAddToCart}
        disabled={isAddToCartDisabled}
        className={`flex w-full items-center justify-center gap-3 rounded-lg py-4 sm:py-5 text-base sm:text-lg font-medium transition-all shadow-premium hover:shadow-premium-hover disabled:opacity-60 disabled:cursor-not-allowed ${
          added 
            ? 'bg-gray-900 text-white' 
            : isLoading
            ? 'bg-gray-900 text-white cursor-wait'
            : isVariantRequired
            ? 'bg-gray-300 text-white cursor-not-allowed'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Legger til...
          </>
        ) : added ? (
          <>
            <Check size={20} className="sm:w-6 sm:h-6" />
            Lagt i handlekurv!
          </>
        ) : isVariantRequired ? (
          <>
            <ShoppingCart size={20} className="sm:w-6 sm:h-6" />
            Velg farge først
          </>
        ) : (
          <>
            <ShoppingCart size={20} className="sm:w-6 sm:h-6" />
            Legg i handlekurv
          </>
        )}
      </button>

      {/* Kjøp nå knapp - legger i cart og navigerer til checkout (kun på PDP) */}
      <button
        onClick={async () => {
          // CRITICAL: Guard - variant must be selected if product has variants
          if (isVariantRequired) {
            toast.error('Velg farge før du går til betaling', {
              icon: '⚠️',
              duration: 3000,
            });
            setError('Velg farge før du kan kjøpe produktet');
            return;
          }

          try {
            setIsLoading(true);
            setError(null);
            
            const itemToAdd = {
              productId: product.id,
              name: product.name,
              price: displayPrice,
              image: displayImage,
              quantity: 1,
              slug: product.slug,
              variantId: selectedVariant?.id || undefined,
              variantName: selectedVariant?.name || undefined,
            };

            addToCart(itemToAdd, quantity);
            toast.success(`${product.name} lagt i handlekurv!`, {
              icon: '🛒',
            });
            
            // Navigate to checkout immediately (buy now flow - only on PDP)
            setTimeout(() => {
              router.push('/checkout');
            }, 300); // Small delay to show toast and ensure cart is updated
          } catch (err) {
            setError('Kunne ikke legge produkt i handlekurv. Prøv igjen.');
            toast.error('Kunne ikke legge produkt i handlekurv. Prøv igjen.');
            console.error('Error adding to cart:', err);
            setIsLoading(false);
          }
        }}
        disabled={isLoading || isVariantRequired}
        className="w-full rounded-lg border border-gray-900 py-4 text-lg font-medium text-gray-900 hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Legger til...' : isVariantRequired ? 'Velg farge først' : 'Kjøp nå'}
      </button>
    </div>
  );
}
