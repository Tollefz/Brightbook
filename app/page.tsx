import type { Metadata } from "next";
import NightReadingLanding from "@/components/landing/NightReadingLanding";
import { product as productConfig } from "@/config/product";
import { getHeroProduct } from "@/lib/get-hero-product";

export const dynamic = "force-dynamic";

const baseUrl = process.env.NEXTAUTH_URL || "https://www.bookbright.no";

export async function generateMetadata(): Promise<Metadata> {
  // Fetch hero product from database with fallback logic
  const heroResult = await getHeroProduct();
  const heroProduct = heroResult.product;

  // Fallback to config if product not found in DB or DB error
  const productName = heroProduct?.name || productConfig.name;
  const productDescription = heroProduct?.description || heroProduct?.shortDescription || productConfig.description;
  const brand = (heroProduct?.specs as any)?.brand || productConfig.brand;

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
  // Fetch hero product from database with fallback logic
  const heroResult = await getHeroProduct();
  const heroProduct = heroResult.product;

  // Log result for debugging (dev only)
  if (process.env.NODE_ENV === 'development' && heroResult.error) {
    console.warn(`[HomePage] Hero product fetch: source=${heroResult.source}, error=${heroResult.error}`);
  }

  // If no hero product found (DB error or no products exist), show empty state
  if (!heroProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50/30 via-white to-white">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {heroResult.source === 'none' 
              ? 'Ingen produkter enda' 
              : 'Ingen hero-produkt valgt enda'}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            {heroResult.source === 'none'
              ? 'Legg til produkter i admin-panelet for å vise dem på forsiden.'
              : 'Gå til admin-panelet og merk et produkt som "Hero" (isHero=true) for å vise det på forsiden.'}
          </p>
          <a
            href="/admin/products"
            className="inline-block px-6 py-3 rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
          >
            Gå til admin
          </a>
          {process.env.NODE_ENV === 'development' && heroResult.error && (
            <p className="mt-4 text-sm text-gray-500">
              Debug: {heroResult.error}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Parse images from JSON string
  let images: string[] = [];
  try {
    images = typeof heroProduct.images === 'string' 
      ? JSON.parse(heroProduct.images) 
      : (Array.isArray(heroProduct.images) ? heroProduct.images : []);
  } catch {
    images = [];
  }

  // Get first image as hero image, fallback to config image
  const heroImage = images[0] || productConfig.heroImage || "/products/bookbright/BR.avif";

  return <NightReadingLanding product={heroProduct} heroImage={heroImage} images={images} />;
}
