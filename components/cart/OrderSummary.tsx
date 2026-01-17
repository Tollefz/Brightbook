"use client";

interface OrderSummaryProps {
  subtotal: number;
  shippingCost: number;
  discountAmount?: number;
  total: number;
  className?: string;
}

export function OrderSummary({
  subtotal,
  shippingCost,
  discountAmount = 0,
  total,
  className = "",
}: OrderSummaryProps) {
  // Always show fixed shipping cost (99 kr)
  const fixedShippingCost = shippingCost || 99;

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
          <div className="flex justify-between text-sm text-gray-700">
            <span>Rabatt</span>
            <span className="font-medium">-{discountAmount.toLocaleString("no-NO")},-</span>
          </div>
        )}

        <div className="flex justify-between text-sm text-gray-600">
          <span>Fast frakt</span>
          <span className="font-medium text-gray-900">
            {fixedShippingCost.toLocaleString("no-NO")},-
          </span>
        </div>
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

