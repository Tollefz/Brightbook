import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import RefTracker from "./RefTracker";
import { Toaster } from "react-hot-toast";
import { SITE_CONFIG } from "@/lib/site";
import { SourceMapSuppress } from "./sourcemap-suppress";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const siteUrl = SITE_CONFIG.siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BookBright",
    template: "%s | BookBright",
  },
  description: "BookBright tilbyr premium leselys og produkter for nattlesing – trygg betaling via Stripe, rask kundeservice og enkle returer.",
  keywords: ["leselys", "nattlesing", "boklys", "LED leseskjerm", "Norge", "nettbutikk"],
  authors: [{ name: "BookBright" }],
  creator: "BookBright",
  publisher: "BookBright",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "no_NO",
    url: "/",
    siteName: "BookBright",
    title: "BookBright - Premium leselys for nattlesing",
    description: "BookBright tilbyr premium leselys og produkter for nattlesing – trygg betaling via Stripe, rask kundeservice og enkle returer.",
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "BookBright - Premium leselys",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BookBright - Premium leselys for nattlesing",
    description: "BookBright tilbyr premium leselys og produkter for nattlesing – trygg betaling via Stripe, rask kundeservice og enkle returer.",
    images: [`${siteUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="no" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-slate-50 font-sans text-gray-900 antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SourceMapSuppress />
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <Suspense fallback={
                <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
                  <div className="h-16 bg-gray-900"></div>
                </header>
              }>
                <Header />
              </Suspense>
              <Suspense fallback={null}>
                <RefTracker />
              </Suspense>
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#10b981',
                  color: '#fff',
                },
                success: {
                  iconTheme: {
                    primary: '#fff',
                    secondary: '#10b981',
                  },
                },
              }}
            />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
