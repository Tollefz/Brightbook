"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Star, Check, Clock, Battery, Moon, BookOpen, ChevronDown, Shield, Truck } from "lucide-react";
import { product } from "@/config/product";
import { useCart } from "@/lib/cart-context";

export default function NightReadingLanding() {
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  const router = useRouter();
  const { addToCart } = useCart();

  const activeImage = product.images[activeImageIndex] || product.images[0];

  const handleImageError = (src: string) => {
    setImageError((prev) => ({ ...prev, [src]: true }));
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Legg produktet i handlekurv
    addToCart({
      productId: product.productId,
      name: product.name,
      price: product.price.amount,
      image: product.heroImage || product.images[0]?.src || "/products/bookbright/BR.avif",
      quantity: 1,
      slug: product.productId,
    }, 1);

    // Redirect til checkout
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 via-white to-white">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-8 sm:pt-12 lg:pt-20 pb-16 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
                <Star className="h-4 w-4 fill-amber-600" />
                {product.rating.score} ({product.rating.countText})
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>
              
              <p className="text-xl sm:text-2xl text-gray-700 mb-6 font-medium">
                {product.tagline}
              </p>
              
              <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                {product.description}
              </p>

              {/* Badges Row */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
                {product.badges.map((badge, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-amber-200 text-sm font-medium text-gray-700 shadow-sm"
                  >
                    <Check className="h-3.5 w-3.5 text-amber-600" />
                    {badge}
                  </span>
                ))}
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 justify-center lg:justify-start mb-8">
                <span className="text-4xl sm:text-5xl font-bold text-gray-900">
                  {product.price.display}
                </span>
                {product.price.compareAtDisplay && (
                  <span className="text-xl text-gray-400 line-through">
                    {product.price.compareAtDisplay}
                  </span>
                )}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleBuyNow}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-amber-600 text-white font-semibold text-lg hover:bg-amber-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  Kjøp nå
                </button>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full border-2 border-gray-300 text-gray-700 font-semibold text-lg hover:bg-gray-50 transition-colors"
                >
                  Se hvordan det fungerer
                </a>
              </div>

              {/* Social Proof */}
              <div className="mt-8 flex items-center justify-center lg:justify-start gap-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating.score)
                          ? "fill-amber-500 text-amber-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{product.rating.score}</span>
                <span>•</span>
                <span>{product.rating.countText}</span>
              </div>
            </div>

            {/* Right: Product Image */}
            {/* 
              TESTING:
              1. Åpne http://localhost:3000/products/bookbright/BR.avif direkte i browser - skal vise bilde (ikke 404)
              2. Åpne /api/debug-assets og se exists=true for alle filer
              3. Hvis bilde feiler, skal fallback (BookOpen ikon) vises uten dev overlay
            */}
            <div className="relative order-first lg:order-last">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-2xl border border-gray-100">
                {imageError[activeImage.src] ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-100 to-amber-50">
                    <div className="text-center p-8">
                      <BookOpen className="h-24 w-24 text-amber-600/30 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">{activeImage.alt}</p>
                    </div>
                  </div>
                ) : (
                  <Image
                    src={activeImage.src}
                    alt={activeImage.alt}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                    onError={(e) => {
                      // Use console.warn to avoid dev error overlay
                      const target = e.target as HTMLImageElement;
                      const exactSrc = target.src || activeImage.src;
                      console.warn("Hero image failed to load (fallback shown):", {
                        expected: activeImage.src,
                        actual: exactSrc,
                        fullUrl: target.src,
                        alt: activeImage.alt,
                      });
                      handleImageError(activeImage.src);
                    }}
                    unoptimized={activeImage.src.endsWith('.avif')}
                  />
                )}
              </div>
              
              {/* Mini Gallery Thumbnails */}
              {product.images.length > 1 && (
                <div className="mt-4 flex gap-2 justify-center lg:justify-start overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveImageIndex(index)}
                      className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIndex === index
                          ? "border-amber-600 ring-2 ring-amber-200 ring-offset-2"
                          : "border-gray-200 hover:border-amber-300"
                      }`}
                      aria-label={`Vis ${image.alt}`}
                    >
                      {imageError[image.src] ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <BookOpen className="h-6 w-6 text-gray-400" />
                        </div>
                      ) : (
                        <Image
                          src={image.src}
                          alt={image.alt}
                          width={80}
                          height={80}
                          className="object-cover w-full h-full"
                          sizes="(max-width: 640px) 64px, 80px"
                          onError={(e) => {
                            // Use console.warn to avoid dev error overlay
                            const target = e.target as HTMLImageElement;
                            const exactSrc = target.src || image.src;
                            console.warn("Thumbnail image failed to load (fallback shown):", {
                              expected: image.src,
                              actual: exactSrc,
                              fullUrl: target.src,
                              alt: image.alt,
                              index,
                            });
                            handleImageError(image.src);
                          }}
                          unoptimized={image.src.endsWith('.avif')}
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM → SOLUTION */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Problem */}
            <div className="rounded-2xl bg-red-50 p-8 lg:p-10 border border-red-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Vanlig leselys
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-red-600 mt-1">✗</span>
                  <span>Blender og lager skarpe lyspunkter</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 mt-1">✗</span>
                  <span>Lager skygger som gjør lesing vanskelig</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 mt-1">✗</span>
                  <span>Forstyrrer partneren med skarpt lys</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 mt-1">✗</span>
                  <span>Må huske å slå av manuelt</span>
                </li>
              </ul>
            </div>

            {/* Solution */}
            <div className="rounded-2xl bg-amber-50 p-8 lg:p-10 border border-amber-200">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                {product.name}
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Jevnt lys over hele boksiden</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Ingen skygger eller mørke flekker</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>Mykt lys som holder rommet mørkt</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <span>99-min timer skrur av automatisk</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-amber-50/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Alt du trenger for perfekt nattlesing
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Designet spesielt for komfortabel lesing uten å forstyrre andre
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {product.features.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl bg-white p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Slik fungerer det
            </h2>
            <p className="text-lg text-gray-600">
              Enkelt å bruke – ingen komplisert montering
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
                <BookOpen className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                1. Klem fast på boken
              </h3>
              <p className="text-gray-600">
                Plasser leseskjermen på boksiden. Den klemmer seg fast uten å skade sidene.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
                <Moon className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                2. Velg lysmodus
              </h3>
              <p className="text-gray-600">
                Velg mellom tre varme lysmoduser og juster styrken etter behov.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-6">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                3. Sett timer og les
              </h3>
              <p className="text-gray-600">
                Sett en timer på 15, 30, 60 eller 99 minutter. Lyset skrur seg av automatisk.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-amber-50/30 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Hva våre kunder sier
            </h2>
            <p className="text-lg text-gray-600">
              {product.rating.countText} fornøyde lesere
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {product.testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="rounded-xl bg-white p-6 lg:p-8 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < testimonial.rating
                          ? "fill-amber-500 text-amber-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  "{testimonial.text}"
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {testimonial.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ofte stilte spørsmål
            </h2>
            <p className="text-lg text-gray-600">
              Alt du lurer på om {product.name}
            </p>
          </div>

          <div className="space-y-4">
            {product.faq.map((faq, index) => (
              <details
                key={index}
                className="group rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-amber-300"
              >
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-gray-900">
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180 flex-shrink-0" />
                </summary>
                <p className="mt-4 text-gray-600 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href={product.links.faq}
              className="inline-block text-amber-600 font-semibold hover:text-amber-700 hover:underline"
            >
              Se alle spørsmål →
            </Link>
          </div>
        </div>
      </section>

      {/* GUARANTEE + SHIPPING */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-amber-50/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {/* Guarantee */}
            <div className="rounded-xl bg-white p-8 lg:p-10 border border-gray-200 shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-6">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                30 dagers garanti
              </h3>
              <p className="text-gray-600 mb-4">
                Vi er sikre på at du vil elske {product.name}. Hvis ikke, kan du returnere produktet innen 30 dager og få full refusjon.
              </p>
              <Link
                href={product.links.garanti}
                className="text-amber-600 font-semibold hover:text-amber-700 hover:underline"
              >
                Les mer om garantien →
              </Link>
            </div>

            {/* Shipping */}
            <div className="rounded-xl bg-white p-8 lg:p-10 border border-gray-200 shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 mb-6">
                <Truck className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Rask levering
              </h3>
              <p className="text-gray-600 mb-4">
                Fri frakt over 500,-. Ordrene behandles raskt og leveres innen 5–12 virkedager etter ordrebehandling.
              </p>
              <Link
                href={product.links.frakt}
                className="text-amber-600 font-semibold hover:text-amber-700 hover:underline"
              >
                Les mer om levering →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-amber-600 to-amber-700 text-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Klar for bedre nattlesing?
          </h2>
          <p className="text-lg sm:text-xl text-amber-100 mb-8">
            Få {product.name} levert hjem til deg med fri frakt
          </p>
          <button
            onClick={handleBuyNow}
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white text-amber-600 font-semibold text-lg hover:bg-amber-50 transition-colors shadow-lg hover:shadow-xl"
          >
            Kjøp nå – {product.price.display}
          </button>
        </div>
      </section>

      {/* STICKY BOTTOM CTA (Mobile) */}
      {showStickyCTA && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">Kun</p>
                <p className="text-2xl font-bold text-gray-900">{product.price.display}</p>
              </div>
              <button
                onClick={handleBuyNow}
                className="flex-1 inline-flex items-center justify-center px-6 py-3 rounded-full bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
              >
                Kjøp nå
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

