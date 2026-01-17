"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { QuantityStepper } from "./QuantityStepper";
import { CartItem } from "@/lib/cart-context";

interface CartLineItemProps {
  item: CartItem;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  isUpdating?: boolean;
  showRemove?: boolean;
}

export function CartLineItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  isUpdating = false,
  showRemove = true,
}: CartLineItemProps) {
  const itemKey = `${item.productId}${item.variantId ? `-${item.variantId}` : ""}`;
  const totalPrice = item.price * item.quantity;

  return (
    <div className="flex gap-3 sm:gap-4 border-b border-gray-200 pb-4 sm:pb-5 last:border-0">
      {/* Produktbilde - ikke klikkbar (forhindrer baklengs flyt) */}
      <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
            sizes="96px"
            onError={(e) => {
              // Silent fallback - don't trigger dev overlay
              console.warn(`Cart item image failed: ${item.image}`);
              const target = e.target as HTMLImageElement;
              if (target) {
                target.style.display = "none";
              }
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
            Ingen bilde
          </div>
        )}
      </div>

      {/* Produktinfo og kontroller */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        {/* Navn og variant - ikke klikkbar (forhindrer baklengs flyt) */}
        <div className="min-w-0 mb-2">
          <div className="block text-sm sm:text-base font-semibold text-gray-900 line-clamp-2">
            {item.name}
            {item.variantName && (
              <span className="font-normal text-gray-600"> – {item.variantName}</span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-700 mt-1">
            {item.price.toLocaleString("no-NO")},- per stk
          </p>
        </div>

        {/* Antall og fjern */}
        <div className="flex items-center justify-between gap-3 sm:gap-4 mt-2">
          <div className="flex-shrink-0">
            <QuantityStepper
              value={item.quantity}
              onDecrease={onDecrease}
              onIncrease={onIncrease}
              min={1}
              max={10}
              disabled={isUpdating}
              loading={isUpdating}
            />
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
            <div className="text-right min-w-0">
              <p className="text-sm sm:text-base font-bold text-gray-900">
                {totalPrice.toLocaleString("no-NO")},-
              </p>
              <p className="text-xs text-gray-500">
                {item.quantity} {item.quantity === 1 ? "stk" : "stk"}
              </p>
            </div>
            {showRemove && (
              <button
                onClick={onRemove}
                disabled={isUpdating}
                className="flex-shrink-0 text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Fjern produkt"
                type="button"
              >
                <Trash2 size={18} className="sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

