"use client";

import Link from "next/link";
import { ShoppingBag, Loader2 } from "lucide-react";
import { useState } from "react";
import { useCart, getCartItemKey } from "@/lib/cart-context";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { OrderSummary } from "@/components/cart/OrderSummary";

export default function CartPage() {
  const { items, total, updateQuantity, removeFromCart, isUpdating } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const shippingCost = total >= 500 ? 0 : 99;
  const totalWithShipping = total + shippingCost;

  if (items.length === 0) {
    return (
      <div className="mx-auto min-h-screen max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center">
        <ShoppingBag className="mx-auto mb-4 h-16 w-16 sm:h-24 sm:w-24 text-gray-300" />
        <h1 className="mb-2 text-xl sm:text-2xl font-bold text-gray-900">Handlekurven er tom</h1>
        <p className="mb-6 text-sm sm:text-base text-gray-600">
          Du har ingen produkter i handlekurven ennå.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-amber-600 px-6 py-3 text-sm sm:text-base font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          Gå til produkt
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <h1 className="mb-4 sm:mb-6 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Handlekurv</h1>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[2fr,1fr]">
        {/* Venstre - Produktliste */}
        <div>
          <div className="rounded-lg bg-white border border-gray-200 p-4 sm:p-6 shadow-sm">
            <div className="space-y-4">
              {items.map((item) => {
                // Use helper function for consistent key generation
                const itemKey = getCartItemKey(item);
                return (
                  <CartLineItem
                    key={itemKey}
                    item={item}
                    onIncrease={() => {
                      // Use current quantity from state, not closure
                      const currentQty = item.quantity;
                      const newQty = currentQty + 1;
                      if (newQty > 10) return;
                      updateQuantity(itemKey, newQty);
                    }}
                    onDecrease={() => {
                      // Use current quantity from state, not closure
                      const currentQty = item.quantity;
                      const newQty = currentQty - 1;
                      if (newQty <= 0) {
                        removeFromCart(itemKey);
                      } else {
                        updateQuantity(itemKey, newQty);
                      }
                    }}
                    onRemove={() => removeFromCart(itemKey)}
                    isUpdating={isUpdating(itemKey)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Høyre - Sammendrag (Desktop) / Nederst (Mobil) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 rounded-lg sm:rounded-xl bg-white border border-gray-200 p-4 sm:p-6 shadow-sm">
            <OrderSummary
              subtotal={total}
              shippingCost={shippingCost}
              total={totalWithShipping}
              freeShippingThreshold={500}
            />

            {checkoutError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {checkoutError}
              </div>
            )}
            <button
              onClick={async () => {
                setIsCheckingOut(true);
                setCheckoutError(null);
                try {
                  const response = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      items: items.map((item) => ({
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        image: item.image,
                        variantId: item.variantId,
                        variantName: item.variantName,
                      })),
                    }),
                  });
                  const data = await response.json();
                  if (data.ok && data.url) {
                    window.location.href = data.url;
                  } else {
                    setCheckoutError(data.error || "Noe gikk galt med kassen. Prøv igjen senere.");
                    setIsCheckingOut(false);
                  }
                } catch (error) {
                  setCheckoutError("Noe gikk galt med kassen. Prøv igjen senere.");
                  setIsCheckingOut(false);
                }
              }}
              disabled={isCheckingOut}
              className="mt-4 sm:mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 py-3 sm:py-4 text-center text-sm sm:text-base font-semibold text-white hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Behandler...</span>
                </>
              ) : (
                "Gå til kassen"
              )}
            </button>

            <Link
              href="/"
              className="mt-3 block text-center text-xs sm:text-sm text-amber-600 hover:text-amber-700 hover:underline"
            >
              ← Tilbake til produkt
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

