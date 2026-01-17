"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { getCartItemKey } from "@/lib/cart-context";

// Håndter Stripe publishable key med ekstra anførselstegn
const getStripeKey = () => {
  let key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";
  // Fjern ekstra anførselstegn hvis de er der
  key = key.replace(/^["']+|["']+$/g, "").trim();
  return key || null;
};

const stripePromise = getStripeKey() ? loadStripe(getStripeKey()!) : null;

const infoSchema = z.object({
  email: z.string().email("Ugyldig e-post"),
  fullName: z.string().min(2, "Navn er påkrevd"),
  phone: z.string().optional().refine((val) => !val || val.length >= 8, {
    message: "Telefonnummer må være minst 8 siffer",
  }),
});

const addressSchema = z.object({
  address1: z.string().min(3, "Adresse er påkrevd"),
  address2: z.string().optional(),
  zipCode: z.string().min(4, "Postnummer er påkrevd"),
  city: z.string().min(2, "By er påkrevd"),
  country: z.string().default("NO"),
});

type InfoData = z.infer<typeof infoSchema>;
type AddressData = {
  address1: string;
  address2?: string;
  zipCode: string;
  city: string;
  country: string;
};

function CheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe er ikke klar. Vent litt...");
      return;
    }

    setLoading(true);
    setError("");

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation`,
      },
    });

    if (submitError) {
      setError(submitError.message || "Noe gikk galt ved betaling");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full"
      >
        {loading ? "Behandler..." : "Betal nå"}
      </Button>
    </form>
  );
}

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [stripeKeyStatus, setStripeKeyStatus] = useState<"checking" | "ok" | "missing">("checking");
  const [checkoutMode, setCheckoutMode] = useState<"stripe" | "test">("stripe");
  const router = useRouter();
  const { items, total, clearCart, updateQuantity, removeFromCart, isUpdating } = useCart();

  // Determine checkout mode and verify Stripe keys
  useEffect(() => {
    // Get checkout mode from env (default: "test" in dev, "stripe" in prod)
    // Note: NEXT_PUBLIC_ prefix is needed for client-side access
    const mode = process.env.NEXT_PUBLIC_CHECKOUT_MODE || 
                 (process.env.NODE_ENV === "production" ? "stripe" : "test");
    setCheckoutMode(mode as "stripe" | "test");

    // Only check Stripe keys if mode is "stripe"
    if (mode === "stripe") {
      let publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() || "";
      
      // Fjern ekstra anførselstegn hvis de er der (f.eks. ""pk_test_..."")
      // Dette skjer hvis man har ekstra anførselstegn i .env filen
      publishableKey = publishableKey.replace(/^["']+|["']+$/g, "");
      publishableKey = publishableKey.trim();
      
      if (publishableKey && (publishableKey.startsWith("pk_test_") || publishableKey.startsWith("pk_live_"))) {
        setStripeKeyStatus("ok");
      } else {
        setStripeKeyStatus("missing");
        // Log kun i development, men ikke som errors (for å unngå error overlay)
        if (process.env.NODE_ENV === "development") {
          // Bruk console.warn i stedet for console.error for å unngå error overlay
          console.warn("⚠️ Stripe publishable key mangler eller er ugyldig");
          if (!publishableKey) {
            console.warn("💡 Legg til NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY i .env filen");
          }
        }
      }
    } else {
      // Test mode - Stripe keys not needed
      setStripeKeyStatus("ok"); // Set to "ok" to hide warnings
    }
  }, []);

  const infoForm = useForm<InfoData>({
    resolver: zodResolver(infoSchema),
  });

  const addressForm = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: "NO" },
  });

  // Fixed shipping cost: always 99 kr (no free shipping)
  const shippingCost = shippingMethod === "standard" ? 99 : 199;
  const grandTotal = Math.max(0, total + shippingCost - discountAmount);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
    }
  }, [items, router]);

  // Hent affiliateCode fra cookie hvis satt
  useEffect(() => {
    if (typeof document === "undefined") return;
    const match = document.cookie.split("; ").find((row) => row.startsWith("affiliateCode="));
    if (match) {
      setAffiliateCode(match.split("=")[1] || null);
    }
  }, []);

  const handleInfoSubmit = async (data: InfoData) => {
    setStep(2);
  };

  const handleAddressSubmit = async (data: any) => {
    // Ensure country is set
    const addressData: AddressData = {
      ...data,
      country: data.country || "NO",
    };
    setStep(3);
  };

  const applyDiscount = async () => {
    setDiscountMessage(null);
    setDiscountAmount(0);
    const code = discountCode.trim();
    if (!code) return;
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!data.valid) {
        setDiscountMessage("Rabattkode er ugyldig eller utløpt.");
        setDiscountAmount(0);
        return;
      }
      const percent = data.percentOff ? data.percentOff / 100 : 0;
      const amount = data.amountOff ?? 0;
      const computed = total * percent + amount;
      const capped = Math.max(0, Math.min(computed, total));
      setDiscountAmount(capped);
      setDiscountMessage(`Rabattkode aktivert: -${capped.toFixed(0)} kr`);
    } catch (e) {
      setDiscountMessage("Kunne ikke validere rabattkode.");
    }
  };

  const handleShippingMethod = () => {
    setStep(4);
  };

  const handleTestCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const infoData = infoForm.getValues();
      const addressData = addressForm.getValues();

      // Valider at vi har all nødvendig data
      if (!infoData.email || !infoData.fullName) {
        throw new Error("Manglende kundeinformasjon");
      }
      if (!addressData.address1 || !addressData.zipCode || !addressData.city) {
        throw new Error("Manglende leveringsadresse");
      }
      if (items.length === 0) {
        throw new Error("Handlekurven er tom");
      }

      const response = await fetch("/api/checkout/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            variantId: item.variantId,
            variantName: item.variantName,
          })),
          customer: {
            email: infoData.email,
            name: infoData.fullName,
            fullName: infoData.fullName,
            phone: infoData.phone,
            address1: addressData.address1,
            address2: addressData.address2,
            zipCode: addressData.zipCode,
            city: addressData.city,
            country: addressData.country,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kunne ikke opprette testordre");
      }

      if (data.ok && data.redirectUrl) {
        clearCart();
        window.location.href = data.redirectUrl;
      } else {
        throw new Error("Uventet respons fra server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke opprette testordre");
      console.error("Error creating test order:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethod = async () => {
    // If in test mode, use test checkout
    if (checkoutMode === "test") {
      await handleTestCheckout();
      return;
    }

    // Hvis Stripe keys mangler, vis en proff melding og la brukeren fortsette
    if (stripeKeyStatus === "missing" || !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      // I stedet for å stoppe flyten, vis en melding og la brukeren se ordresammendrag
      setError(null);
      setStep(5); // Gå direkte til bekreftelsessteget
      // Sett en placeholder clientSecret for å vise fallback UI
      setClientSecret("placeholder-no-stripe");
      return;
    }

    if (paymentMethod !== "card") {
      // For andre betalingsmetoder, gå direkte til bekreftelse
      // Dette kan utvides senere
      clearCart();
      router.push("/order-confirmation");
      return;
    }

    // For Stripe (card payment)
    setLoading(true);
    setError(null);

    try {
      const infoData = infoForm.getValues();
      const addressData = addressForm.getValues();


      // Valider at vi har all nødvendig data
      if (!infoData.email || !infoData.fullName) {
        throw new Error("Manglende kundeinformasjon");
      }
      if (!addressData.address1 || !addressData.zipCode || !addressData.city) {
        throw new Error("Manglende leveringsadresse");
      }
      if (items.length === 0) {
        throw new Error("Handlekurven er tom");
      }

      const response = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer: {
            email: infoData.email,
            name: infoData.fullName,
            fullName: infoData.fullName,
            phone: infoData.phone,
            address: addressData.address1,
            address1: addressData.address1,
            address2: addressData.address2,
            zip: addressData.zipCode,
            zipCode: addressData.zipCode,
            city: addressData.city,
            country: addressData.country,
          },
          total: grandTotal,
          shippingCost,
          discountCode: discountCode.trim() || undefined,
          affiliateCode: affiliateCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ API Error:", {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details,
        });
        throw new Error(
          data.error || `Kunne ikke opprette betaling (${response.status}: ${response.statusText})`
        );
      }

      if (!data.clientSecret) {
        console.error("❌ No clientSecret in response:", data);
        throw new Error("Mottok ikke betalingsnøkkel fra server");
      }


      setClientSecret(data.clientSecret);
      setOrderId(data.orderId);
      setStep(5); // Gå til Stripe PaymentElement
      setError(null);
    } catch (error: any) {
      console.error("❌ Error creating payment intent:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      setError(
        `Feil ved opprettelse av betaling: ${error.message || "Noe gikk galt. Prøv igjen."}`
      );
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <h1 className="mb-6 text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>
      <div className="mb-8 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm font-medium">
        {["Informasjon", "Levering", "Leveringsmetode", "Betaling", "Bekreftelse"].map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border-2 font-semibold transition-all ${
                step > index + 1
                  ? "border-gray-900 bg-gray-900 text-white"
                  : step === index + 1
                    ? "border-gray-900 bg-gray-50 text-gray-900"
                    : "border-gray-300 bg-white text-gray-400"
              }`}
            >
              {index + 1}
            </span>
            <span className={`hidden sm:inline ${step === index + 1 ? "text-gray-900 font-semibold" : step > index + 1 ? "text-gray-600" : "text-gray-400"}`}>{label}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-6">
          {/* Rabattkode */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Rabattkode</h2>
            <p className="text-sm text-gray-600">Har du en kode? Legg den inn her.</p>
            <div className="flex gap-2">
              <Input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Rabattkode"
                className="flex-1"
              />
              <Button type="button" onClick={applyDiscount} className="bg-gray-900 hover:bg-gray-800 text-white">
                Aktiver
              </Button>
            </div>
            {discountMessage && <p className="text-sm text-gray-700 font-medium">{discountMessage}</p>}
          </div>
          {step === 1 && (
            <form
              className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4"
              onSubmit={infoForm.handleSubmit(handleInfoSubmit)}
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Kundeinformasjon</h2>
              <Input
                type="email"
                placeholder="E-post *"
                {...infoForm.register("email")}
              />
              {infoForm.formState.errors.email && (
                <p className="text-sm text-danger">{infoForm.formState.errors.email.message}</p>
              )}
              <Input
                type="text"
                placeholder="Fullt navn *"
                {...infoForm.register("fullName")}
              />
              {infoForm.formState.errors.fullName && (
                <p className="text-sm text-danger">{infoForm.formState.errors.fullName.message}</p>
              )}
              <Input
                type="tel"
                placeholder="Telefon"
                {...infoForm.register("phone")}
              />
              <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                Fortsett til levering
              </Button>
            </form>
          )}

          {step === 2 && (
            <form
              className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm space-y-4"
              onSubmit={addressForm.handleSubmit(handleAddressSubmit)}
            >
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Leveringsadresse</h2>
              <Input
                type="text"
                placeholder="Adresse *"
                {...addressForm.register("address1")}
              />
              {addressForm.formState.errors.address1 && (
                <p className="text-sm text-danger">{addressForm.formState.errors.address1.message}</p>
              )}
              <Input
                type="text"
                placeholder="Adresselinje 2 (valgfritt)"
                {...addressForm.register("address2")}
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Input
                    type="text"
                    placeholder="Postnummer *"
                    {...addressForm.register("zipCode")}
                  />
                  {addressForm.formState.errors.zipCode && (
                    <p className="text-sm text-danger">{addressForm.formState.errors.zipCode.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="text"
                    placeholder="By *"
                    {...addressForm.register("city")}
                  />
                  {addressForm.formState.errors.city && (
                    <p className="text-sm text-danger">{addressForm.formState.errors.city.message}</p>
                  )}
                </div>
              </div>
              <select
                className="w-full rounded-lg border px-3 py-2"
                {...addressForm.register("country")}
              >
                <option value="NO">Norge</option>
                <option value="SE">Sverige</option>
                <option value="DK">Danmark</option>
              </select>
              <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800 text-white">
                Fortsett til leveringsmetode
              </Button>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Leveringsmetode</h2>
              <div className="space-y-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4">
                  <input
                    type="radio"
                    checked={shippingMethod === "standard"}
                    onChange={() => setShippingMethod("standard")}
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      Standard (5-7 dager) - Gratis over 500 kr
                    </p>
                    <p className="text-sm text-secondary">Sendes med Posten</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4">
                  <input
                    type="radio"
                    checked={shippingMethod === "express"}
                    onChange={() => setShippingMethod("express")}
                  />
                  <div>
                    <p className="font-semibold text-slate-900">Express (2-3 dager) - 99 kr</p>
                    <p className="text-sm text-secondary">Prioritert levering</p>
                  </div>
                </label>
              </div>
              <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white" onClick={handleShippingMethod}>
                Fortsett til betaling
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Betaling</h2>
              
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 whitespace-pre-line">
                  {error}
                </div>
              )}

              {checkoutMode === "test" ? (
                // Test mode - show test checkout button
                <div className="space-y-4">
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-blue-600 font-semibold">🧪 Testbetaling (DEV-only)</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Du er i test-modus. Ordre vil bli opprettet uten faktisk betaling.
                    </p>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                    onClick={handleTestCheckout}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="mr-2">⏳</span>
                        Oppretter testordre...
                      </>
                    ) : (
                      "Fullfør testordre (ingen betaling)"
                    )}
                  </Button>
                </div>
              ) : (
                // Stripe mode - show payment options
                <>
                  {stripeKeyStatus === "missing" && (
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-600 font-semibold">⚠️ Stripe er ikke konfigurert</span>
                      </div>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <p>Følgende miljøvariabler mangler i <code className="bg-yellow-100 px-1 rounded">.env.local</code>:</p>
                        <ul className="list-disc list-inside ml-2 space-y-0.5">
                          <li><code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code></li>
                          <li><code className="bg-yellow-100 px-1 rounded">STRIPE_SECRET_KEY</code></li>
                        </ul>
                        <p className="mt-2">Se <code className="bg-yellow-100 px-1 rounded">STRIPE_SETUP.md</code> for instruksjoner.</p>
                        <p className="mt-2 font-medium">Alternativ: Sett <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_CHECKOUT_MODE=test</code> for testbetaling.</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {[
                      { value: "card", label: "Kort (Visa/Mastercard)", available: true },
                      { value: "vipps", label: "Vipps", available: false },
                      { value: "klarna", label: "Klarna", available: false },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${
                          !option.available ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          checked={paymentMethod === option.value}
                          onChange={() => option.available && setPaymentMethod(option.value)}
                          disabled={!option.available}
                        />
                        <span className="font-semibold text-slate-900">
                          {option.label}
                          {!option.available && " (Kommer snart)"}
                        </span>
                      </label>
                    ))}
                  </div>
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50"
                    onClick={handlePaymentMethod}
                    disabled={loading || (stripeKeyStatus === "missing" && checkoutMode === "stripe") || paymentMethod !== "card"}
                  >
                    {loading ? (
                      <>
                        <span className="mr-2">⏳</span>
                        Oppretter betaling...
                      </>
                    ) : (
                      "Fortsett til betalingsformular"
                    )}
                  </Button>
                </>
              )}
            </div>
          )}

          {step === 5 && clientSecret && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="mb-4 text-lg sm:text-xl font-semibold text-gray-900">Betal med kort</h2>
              {!stripePromise || stripeKeyStatus === "missing" ? (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-6 text-center">
                  <div className="mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-4">
                      <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Betaling aktiveres snart</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Vi jobber med å aktivere betalingsløsningen. Din ordre er registrert og vi kontakter deg for betaling.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-amber-200 text-left">
                      <p className="text-sm font-medium text-gray-900 mb-2">Ordresammendrag:</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Produkter:</span>
                          <span className="font-medium">{formatCurrency(total)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Frakt:</span>
                          <span className="font-medium">{formatCurrency(shippingCost)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-gray-900">
                          <span>Total:</span>
                          <span>{formatCurrency(grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-gray-500">
                      Vi sender deg en e-post med betalingsinformasjon så snart betaling er aktivert.
                    </p>
                  </div>
                </div>
              ) : (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                    },
                    locale: "no",
                  }}
                >
                  <div className="mb-4 rounded-lg bg-gray-50 border border-gray-300 p-4 text-sm text-gray-700">
                    💡 <strong>Test kort:</strong> 4242 4242 4242 4242<br />
                    CVV: 123 | Utløpsdato: Hvilken som helst fremtidig dato
                  </div>
                  <CheckoutForm clientSecret={clientSecret} />
                </Elements>
              )}
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 space-y-4 rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm h-fit">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Ordresammendrag</h2>
          <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-2">
            <label className="block text-sm font-medium text-slate-800">Rabattkode</label>
            <input
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Rabattkode (valgfritt)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="space-y-4">
            {items.map((item) => {
              // Use helper function for consistent key generation
              const itemKey = getCartItemKey(item);
              return (
                <CartLineItem
                  key={itemKey}
                  item={item}
                  onIncrease={() => {
                    // Use current quantity from state, not closure
                    const currentQty = item.quantity;
                    const newQty = currentQty + 1;
                    if (newQty > 10) return;
                    updateQuantity(itemKey, newQty);
                  }}
                  onDecrease={() => {
                    // Use current quantity from state, not closure
                    const currentQty = item.quantity;
                    const newQty = currentQty - 1;
                    if (newQty <= 0) {
                      removeFromCart(itemKey);
                    } else {
                      updateQuantity(itemKey, newQty);
                    }
                  }}
                  onRemove={() => removeFromCart(itemKey)}
                  isUpdating={isUpdating(itemKey)}
                  showRemove={true}
                />
              );
            })}
          </div>
          <OrderSummary
            subtotal={total}
            shippingCost={shippingCost}
            discountAmount={discountAmount}
            total={grandTotal}
            className="border-t pt-4"
          />
          {discountMessage && (
            <p className="text-xs text-gray-700 mt-2">{discountMessage}</p>
          )}
        </aside>
      </div>
    </div>
  );
}
