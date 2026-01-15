import type { Metadata } from "next";
import NightReadingLanding from "@/components/landing/NightReadingLanding";
import { product } from "@/config/product";

const baseUrl = process.env.NEXTAUTH_URL || "https://www.bookbright.no";

export const metadata: Metadata = {
  title: `${product.brand} - ${product.name}`,
  description: product.description,
  keywords: ["leselys", "nattlesing", "LED leseskjerm", "boklys", "lesing i senga", "Norge"],
  openGraph: {
    title: `${product.brand} - ${product.name}`,
    description: product.description,
    type: "website",
    url: baseUrl,
    siteName: product.brand,
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${product.brand} - ${product.name}`,
      }
    ],
    locale: "nb_NO",
  },
  twitter: {
    card: "summary_large_image",
    title: `${product.brand} - ${product.name}`,
    description: product.description,
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

export default function HomePage() {
  return <NightReadingLanding />;
}
