import type { Metadata } from "next";
import NightReadingLanding from "@/components/landing/NightReadingLanding";
import { product as productConfig } from "@/config/product";
import { getLandingProduct } from "@/lib/get-hero-product";

export const dynamic = "force-dynamic";

// Use NEXT_PUBLIC_SITE_URL for public pages (not NEXTAUTH_URL)
// This ensures public pages work even if auth is not configured
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.bookbright.no";

export async function generateMetadata(): Promise<Metadata> {
  // Fetch the specific LED product for the landing page
  const landingResult = await getLandingProduct();
  const landingProduct = landingResult.product;

  // Fallback to config if product not found in DB or DB error
  const productName = landingProduct?.name || productConfig.name;
  const productDescription = landingProduct?.description || landingProduct?.shortDescription || productConfig.description;
  const brand = (landingProduct?.specs as any)?.brand || productConfig.brand;

  return {
    title: `${brand} - ${productName}`,
    description: productDescription,
    keywords: ["leselys", "nattlesing", "LED leseskjerm", "boklys", "lesing i senga", "Norge"],
    openGraph: {
      title: `${brand} - ${productName}`,
      description: productDescription,
      type: "website",
      url: baseUrl,
      siteName: brand,
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${brand} - ${productName}`,
        }
      ],
      locale: "nb_NO",
    },
    twitter: {
      card: "summary_large_image",
      title: `${brand} - ${productName}`,
      description: productDescription,
    },
    alternates: {
      canonical: baseUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function HomePage() {
  // Fetch the specific LED product for the landing page
  const landingResult = await getLandingProduct();
  const landingProduct = landingResult.product;

  // Log result for debugging (dev only)
  if (process.env.NODE_ENV === 'development' && landingResult.error) {
    console.warn(`[HomePage] Landing product fetch: source=${landingResult.source}, error=${landingResult.error}`);
  }

  // If no landing product found, show fallback UI (not blank page)
  if (!landingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50/30 via-white to-white">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Produktet er ikke tilgjengelig enda
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Vi jobber med å gjøre LED-leseskjermen tilgjengelig. Sjekk tilbake snart!
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              I mellomtiden kan du se på våre andre produkter.
            </p>
            <a
              href="/products"
              className="inline-block px-6 py-3 rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
            >
              Se alle produkter
            </a>
          </div>
          {process.env.NODE_ENV === 'development' && landingResult.error && (
            <p className="mt-4 text-sm text-gray-500">
              Debug: {landingResult.error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Parse images from JSON string
  let images: string[] = [];
  try {
    images = typeof landingProduct.images === 'string'
      ? JSON.parse(landingProduct.images)
      : (Array.isArray(landingProduct.images) ? landingProduct.images : []);
  } catch {
    images = [];
  }

  // Get first image as hero image, fallback to config image
  const heroImage = images[0] || productConfig.heroImage || "/products/bookbright/BR.avif";

  return <NightReadingLanding product={landingProduct} heroImage={heroImage} images={images} />;
}
