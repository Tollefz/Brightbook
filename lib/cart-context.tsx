"use client";

import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug?: string;
  variantId?: string;
  variantName?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  isUpdating: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "dropshipping-cart";

// Helper function to generate consistent cart item key
export function getCartItemKey(item: CartItem): string;
export function getCartItemKey(productId: string, variantId?: string): string;
export function getCartItemKey(itemOrProductId: CartItem | string, variantId?: string): string {
  if (typeof itemOrProductId === "string") {
    return `${itemOrProductId}${variantId ? `-${variantId}` : ""}`;
  }
  const item = itemOrProductId;
  return `${item.productId}${item.variantId ? `-${item.variantId}` : ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const lockTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const hasHydratedRef = useRef(false); // Prevent re-hydration from localStorage

  // Hydrate from localStorage ONLY ONCE on mount
  useEffect(() => {
    if (typeof window === "undefined" || hasHydratedRef.current) return;
    const stored = window.localStorage.getItem(CART_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
          hasHydratedRef.current = true;
        }
      } catch {
        setItems([]);
        hasHydratedRef.current = true;
      }
    } else {
      hasHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const setItemLock = (key: string, duration = 150) => {
    // Update state to trigger re-render (very short lock, just to prevent double-clicks)
    setUpdatingItems((prev) => new Set(prev).add(key));
    
    // Clear existing timeout if any
    const existingTimeout = lockTimeoutRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout - very short to allow quick updates
    const timeout = setTimeout(() => {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      lockTimeoutRef.current.delete(key);
    }, duration);
    lockTimeoutRef.current.set(key, timeout);
    
    // Failsafe: unlock after 1000ms regardless (reduced from 2000ms)
    setTimeout(() => {
      setUpdatingItems((prev) => {
        if (prev.has(key)) {
          if (process.env.NODE_ENV === "development") {
            console.warn(`⚠️ Cart item ${key} was locked for >1000ms, forcing unlock`);
          }
          const next = new Set(prev);
          next.delete(key);
          const failsafeTimeout = lockTimeoutRef.current.get(key);
          if (failsafeTimeout) {
            clearTimeout(failsafeTimeout);
            lockTimeoutRef.current.delete(key);
          }
          return next;
        }
        return prev;
      });
    }, 1000);
  };

  const addToCart = (item: CartItem, quantity = 1) => {
    setItems((prev) => {
      const itemKey = getCartItemKey(item);
      // Find existing item using consistent key
      const existing = prev.find((cartItem) => getCartItemKey(cartItem) === itemKey);
      
      if (existing) {
        // Update quantity if item exists
        return prev.map((cartItem) =>
          getCartItemKey(cartItem) === itemKey
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }
      // Add new item
      return [...prev, { ...item, quantity }];
    });
  };

  const removeFromCart = (key: string) => {
    // Debug logging (dev only)
    if (process.env.NODE_ENV === "development") {
      const currentItem = items.find((item) => getCartItemKey(item) === key);
      console.log("🗑️ removeFromCart:", {
        key,
        itemName: currentItem?.name || "unknown",
        timestamp: new Date().toISOString(),
      });
    }

    // OPTIMISTIC UPDATE: Remove immediately using functional update
    setItems((prev) => {
      const filtered = prev.filter((item) => getCartItemKey(item) !== key);

      // Debug logging after update (dev only)
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Cart updated (removed):", {
          key,
          remainingItems: filtered.length,
          cartTotal: filtered.reduce((sum, item) => sum + item.price * item.quantity, 0),
        });
      }

      return filtered;
    });

    // Set lock AFTER optimistic update
    setItemLock(key, 150);
  };

  const isUpdating = (key: string): boolean => {
    return updatingItems.has(key);
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(key);
      return;
    }

    // Parse key to get productId and variantId
    const [productId, variantId] = key.split("-");
    const hasVariant = key.includes("-") && variantId;
    
    // Hard debug logging BEFORE update (dev only)
    if (process.env.NODE_ENV === "development") {
      const currentItem = items.find((item) => {
        const itemKey = getCartItemKey(item);
        return itemKey === key;
      });
      console.log("🛒 updateQuantity CALLED:", {
        incomingKey: key,
        productId,
        variantId: hasVariant ? variantId : "none",
        oldQty: currentItem?.quantity || 0,
        newQty: quantity,
        allItemKeys: items.map((i) => ({
          key: getCartItemKey(i),
          productId: i.productId,
          variantId: i.variantId || "none",
          qty: i.quantity,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // OPTIMISTIC UPDATE: Update state immediately using functional update
    setItems((prev) => {
      const updated = prev.map((item) => {
        const itemKey = getCartItemKey(item);
        if (itemKey === key) {
          return { ...item, quantity };
        }
        return item;
      });

      // Verify update worked
      const updatedItem = updated.find((item) => getCartItemKey(item) === key);
      
      // Hard debug logging after update (dev only)
      if (process.env.NODE_ENV === "development") {
        const cartTotal = updated.reduce((sum, item) => sum + item.price * item.quantity, 0);
        console.log("✅ Cart state updated:", {
          itemId: key,
          productId,
          variantId: hasVariant ? variantId : "none",
          foundItem: !!updatedItem,
          newQty: updatedItem?.quantity || 0,
          itemPrice: updatedItem?.price || 0,
          itemSubtotal: (updatedItem?.price || 0) * (updatedItem?.quantity || 0),
          totalItems: updated.length,
          cartTotal,
          allItems: updated.map((i) => ({
            key: getCartItemKey(i),
            name: i.name,
            qty: i.quantity,
            price: i.price,
          })),
        });
        
        if (!updatedItem) {
          console.error("❌ ERROR: Item not found after update!", {
            searchedKey: key,
            availableKeys: updated.map((i) => getCartItemKey(i)),
          });
        }
      }

      return updated;
    });

    // Set lock AFTER optimistic update (to prevent double-clicks, but allow UI to update)
    setItemLock(key, 150);
  };

  const clearCart = () => setItems([]);

  const { total, itemCount } = useMemo(() => {
    const calculatedTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const calculatedItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Debug logging (dev only)
    if (process.env.NODE_ENV === "development") {
      console.log("💰 Cart totals recalculated:", {
        itemCount: calculatedItemCount,
        total: calculatedTotal,
        items: items.map((item) => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
        })),
      });
    }
    
    return {
      total: calculatedTotal,
      itemCount: calculatedItemCount,
    };
  }, [items]);

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
    itemCount,
    isUpdating,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    // Return a default no-op implementation instead of throwing
    // This allows components to render during SSR or if CartProvider is not available
    return {
      items: [],
      addToCart: () => {
        if (typeof window !== "undefined") {
          console.warn("CartProvider not available - cannot add to cart");
        }
      },
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {},
      total: 0,
      itemCount: 0,
      isUpdating: () => false,
    };
  }
  return context;
}

