"use client";

import { Minus, Plus } from "lucide-react";

interface QuantityStepperProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  min = 1,
  max = 10,
  disabled = false,
  loading = false,
  className = "",
}: QuantityStepperProps) {
  // Note: isUpdating is now managed externally via loading prop from cart context

  const handleDecrease = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (value <= min || disabled || loading) return;
    
    // Call handler immediately (optimistic update happens in cart context)
    try {
      onDecrease();
    } catch (error) {
      console.error("Error decreasing quantity:", error);
    }
  };

  const handleIncrease = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (value >= max || disabled || loading) return;
    
    // Call handler immediately (optimistic update happens in cart context)
    try {
      onIncrease();
    } catch (error) {
      console.error("Error increasing quantity:", error);
    }
  };

  const isDecreaseDisabled = value <= min || disabled || loading;
  const isIncreaseDisabled = value >= max || disabled || loading;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-gray-600">Antall</label>
      <div className="flex items-center rounded-lg border border-gray-300 bg-white overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={handleDecrease}
          disabled={isDecreaseDisabled}
          className={`flex min-h-[40px] min-w-[40px] items-center justify-center transition-all ${
            isDecreaseDisabled
              ? "cursor-not-allowed text-gray-300 bg-gray-50"
              : "text-gray-700 hover:bg-amber-50 hover:text-amber-600 active:bg-amber-100 active:scale-95"
          }`}
          aria-label="Reduser antall"
        >
          {loading ? (
            <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Minus size={18} />
          )}
        </button>
        <span className="min-w-[3rem] text-center text-sm font-semibold text-gray-900 py-2">
          {loading ? "..." : value}
        </span>
        <button
          type="button"
          onClick={handleIncrease}
          disabled={isIncreaseDisabled}
          className={`flex min-h-[40px] min-w-[40px] items-center justify-center transition-all ${
            isIncreaseDisabled
              ? "cursor-not-allowed text-gray-300 bg-gray-50"
              : "text-gray-700 hover:bg-amber-50 hover:text-amber-600 active:bg-amber-100 active:scale-95"
          }`}
          aria-label="Øk antall"
        >
          {loading ? (
            <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus size={18} />
          )}
        </button>
      </div>
      {value >= max && (
        <p className="text-xs text-amber-600">Maks {max} per ordre</p>
      )}
    </div>
  );
}

