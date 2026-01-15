"use client";

interface OrderSummaryProps {
  subtotal: number;
  shippingCost: number;
  discountAmount?: number;
  total: number;
  freeShippingThreshold?: number;
  className?: string;
}

export function OrderSummary({
  subtotal,
  shippingCost,
  discountAmount = 0,
  total,
  freeShippingThreshold = 500,
  className = "",
}: OrderSummaryProps) {
  const remainingForFreeShipping = freeShippingThreshold - subtotal;
  const hasFreeShipping = shippingCost === 0;

  return (
    <div className={`space-y-4 ${className}`}>
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Ordresammendrag</h2>

      <div className="space-y-3 border-b border-gray-200 pb-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Delsum</span>
          <span className="font-medium text-gray-900">
            {subtotal.toLocaleString("no-NO")},-
          </span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Rabatt</span>
            <span className="font-medium">-{discountAmount.toLocaleString("no-NO")},-</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-gray-600">
          <span>Frakt</span>
          <span className={`font-medium ${hasFreeShipping ? "text-green-600" : "text-gray-900"}`}>
            {hasFreeShipping ? "Gratis!" : `${shippingCost.toLocaleString("no-NO")},-`}
          </span>
        </div>

        {!hasFreeShipping && remainingForFreeShipping > 0 && remainingForFreeShipping < freeShippingThreshold && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs sm:text-sm">
            <p className="text-amber-800 font-medium mb-1">✨ Få gratis frakt!</p>
            <p className="text-amber-700">
              Legg til {remainingForFreeShipping.toLocaleString("no-NO")},- mer og få gratis frakt.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-baseline pt-2">
        <span className="text-lg sm:text-xl font-bold text-gray-900">Total</span>
        <span className="text-lg sm:text-xl font-bold text-gray-900">
          {total.toLocaleString("no-NO")},-
        </span>
      </div>
    </div>
  );
}

