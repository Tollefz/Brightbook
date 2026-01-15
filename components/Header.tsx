'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart-context';
import { LogoV5 } from '@/components/Logo';
import { SITE_CONFIG } from '@/lib/site';

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCart();

  // Fix hydration error: only render cart count after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
      {/* Øverste linje - grønn */}
      <div className="bg-green-600">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-1.5 text-[10px] sm:text-xs text-white">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="whitespace-nowrap">Fri frakt over {SITE_CONFIG.freeShippingThreshold},-</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline whitespace-nowrap">{SITE_CONFIG.deliveryPromise}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/kundeservice" className="hover:underline whitespace-nowrap text-[10px] sm:text-xs">Kundeservice</Link>
              <Link href="/admin/login" className="hover:underline whitespace-nowrap text-[10px] sm:text-xs">For bedrift</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hovedheader - hvit */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          {/* Mobile: Top row med logo, søkeknapp, handlekurv */}
          <div className="flex items-center justify-between gap-3 py-3 lg:hidden">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <LogoV5 />
            </Link>

            {/* Søkeknapp på mobil */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="flex-1 flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Search size={18} />
              <span className="text-gray-500">Søk...</span>
            </button>

            {/* Handlekurv på mobil */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart size={22} className="text-gray-700" />
              {mounted && itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile: Søkefelt (vises når mobileSearchOpen) */}
          {mobileSearchOpen && (
            <div className="border-t border-gray-200 bg-white py-3 lg:hidden">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
                    setMobileSearchOpen(false);
                  }
                }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Søk blant produkter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white py-2.5 pl-4 pr-12 text-sm focus:border-brand focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-brand p-2 text-white hover:bg-brand-dark transition-colors"
                >
                  <Search size={18} />
                </button>
              </form>
            </div>
          )}

          {/* Desktop: Full layout */}
          <div className="hidden lg:flex items-center gap-6 py-4">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <LogoV5 />
            </Link>

            {/* Søkefelt - stort og sentrert */}
            <div className="flex-1 max-w-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Søk blant produkter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-300 bg-white py-2.5 pl-5 pr-14 text-sm focus:border-brand focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand p-2.5 text-white hover:bg-brand-dark transition-colors"
                >
                  <Search size={18} />
                </button>
              </form>
            </div>

            {/* Høyre side - ikoner */}
            <div className="flex items-center gap-1">
              {/* Min konto */}
              <Link
                href="/admin/login"
                className="flex flex-col items-center rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <User size={20} className="text-gray-700" />
                <span className="mt-1 text-xs text-gray-600">Min konto</span>
              </Link>

              {/* Handlekurv */}
              <Link
                href="/cart"
                className="relative flex flex-col items-center rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="relative">
                  <ShoppingCart size={20} className="text-gray-700" />
                  {mounted && itemCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-xs text-gray-600">Handlekurv</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

    </header>
  );
}
