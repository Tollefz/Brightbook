# Stripe Setup for BookBright

## Testbetaling (DEV-only)

For lokal utvikling uten Stripe, sett:
```env
NEXT_PUBLIC_CHECKOUT_MODE=test
```

Dette aktiverer en testbetaling-funksjon som lar deg opprette ordre uten faktisk betaling. Se `TEST_CHECKOUT.md` for detaljer.

## Miljøvariabler

Legg til følgende miljøvariabler i `.env.local` (for lokal utvikling):

```env
# Stripe Publishable Key (fra Stripe Dashboard → Developers → API Keys)
# Starter med "pk_test_" for test eller "pk_live_" for produksjon
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Secret Key (fra Stripe Dashboard → Developers → API Keys)
# Starter med "sk_test_" for test eller "sk_live_" for produksjon
# Viktig: Ikke del denne key-en eller commit den til git!
STRIPE_SECRET_KEY=sk_test_...

# Stripe Webhook Secret (valgfritt lokalt, påkrevd i produksjon)
# Få denne fra Stripe Dashboard → Developers → Webhooks → [din webhook] → Signing secret
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Currency (valgfritt, default: "nok")
STRIPE_CURRENCY=nok

# Site URL (valgfritt, default: http://localhost:3000)
# Brukes for success/cancel URLs hvis ikke spesifisert
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Success URL (valgfritt, default: ${NEXT_PUBLIC_SITE_URL}/order-confirmation)
STRIPE_SUCCESS_URL=http://localhost:3000/order-confirmation

# Cancel URL (valgfritt, default: ${NEXT_PUBLIC_SITE_URL}/cart)
STRIPE_CANCEL_URL=http://localhost:3000/cart
```

## Hvordan få Stripe Keys

### 1. Opprett Stripe-konto

1. Gå til [Stripe Dashboard](https://dashboard.stripe.com)
2. Logg inn eller opprett en gratis konto
3. Velg "Test mode" (toggle øverst til høyre)

### 2. Hent API Keys

1. Gå til **Developers** → **API Keys**
2. Under **Standard keys**:
   - **Publishable key** (starter med `pk_test_`) → kopier til `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** (klikk "Reveal test key", starter med `sk_test_`) → kopier til `STRIPE_SECRET_KEY`

⚠️ **Viktig:** 
- Ikke del secret key med noen
- Ikke commit secret key til git
- Bruk test keys (`pk_test_` / `sk_test_`) for lokal utvikling
- Bruk live keys (`pk_live_` / `sk_live_`) kun i produksjon

### 3. (Valgfritt) Sett opp Webhook for lokal testing

For lokal testing kan du bruke Stripe CLI:

1. Installer [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Logg inn: `stripe login`
3. Forward webhooks til lokal server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Stripe CLI vil vise en webhook secret (starter med `whsec_`) - kopier denne til `STRIPE_WEBHOOK_SECRET`

**Alternativ:** I lokal utvikling kan du hoppe over webhook secret - systemet vil fungere, men webhook-signaturverifisering blir hoppet over.

## Testkort

For testbetalinger, bruk følgende kort:

- **Kortnummer:** `4242 4242 4242 4242`
- **Utløpsdato:** Hvilken som helst fremtidig dato (f.eks. `12/25`)
- **CVC:** Hvilket som helst 3-sifret tall (f.eks. `123`)
- **Postnummer:** Hvilket som helst postnummer (f.eks. `12345`)

Andre testkort:
- **3D Secure:** `4000 0025 0000 3155`
- **Avvist kort:** `4000 0000 0000 0002`
- **Insufficient funds:** `4000 0000 0000 9995`

Se [Stripe Test Cards](https://stripe.com/docs/testing) for flere.

## Testinstruks

### 1. Sett miljøvariabler

1. Opprett eller rediger `.env.local` i prosjektets rotmappe
2. Legg til Stripe keys (se over)
3. Lagre filen

### 2. Restart dev-server

```bash
# Stopp serveren (Ctrl+C)
npm run dev
```

### 3. Test betalingsflyt

1. Gå til `/checkout`
2. Sjekk at "Stripe er ikke konfigurert"-warningen er borte
3. Fyll ut kundeinformasjon og leveringsadresse
4. Velg "Kort (Visa/Mastercard)"
5. Klikk "Fortsett til betalingsformular"
6. I Stripe Elements-formularen:
   - Skriv inn testkort: `4242 4242 4242 4242`
   - Utløpsdato: `12/25`
   - CVC: `123`
   - Postnummer: `1234`
7. Klikk "Betal nå"
8. Du skal bli redirectet til `/order-confirmation`

### 4. Verifiser ordre

1. Gå til `/admin/orders`
2. Du skal se en ny ordre med status "Paid"
3. Klikk på ordren for å se detaljer
4. I Stripe Dashboard → **Payments** skal du også se betalingen

## Feilsøking

### "Stripe er ikke konfigurert" vises fortsatt

1. Sjekk at `.env.local` eksisterer (ikke bare `.env`)
2. Sjekk at variablene heter nøyaktig:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (ikke `STRIPE_PUBLISHABLE_KEY`)
   - `STRIPE_SECRET_KEY` (ikke `STRIPE_SECRET`)
3. Sjekk at keys starter med `pk_test_` og `sk_test_`
4. **Restart dev-serveren** (Next.js leser ikke `.env` endringer automatisk)

### "Invalid API key" feil

1. Sjekk at secret key ikke har ekstra mellomrom eller linjeskift
2. Kopier key-en på nytt fra Stripe Dashboard
3. Sjekk at du bruker test keys (`sk_test_`) i dev, ikke live keys
4. Sjekk at key-en ikke er utløpt eller deaktivert i Stripe Dashboard

### Webhook feiler

1. I lokal utvikling: Webhook secret er valgfritt - systemet fungerer uten
2. I produksjon: Webhook secret er påkrevd
3. For lokal testing med webhooks: Bruk Stripe CLI (se over)

### Betaling går gjennom, men ordre vises ikke i admin

1. Sjekk at webhook handler fungerer: `/api/webhooks/stripe`
2. Sjekk Stripe Dashboard → **Developers** → **Webhooks** for webhook events
3. Sjekk server logs for webhook errors
4. I lokal utvikling: Webhooks kan være vanskelige - test med Stripe CLI

## Produksjon

For produksjon:

1. Bytt til **Live mode** i Stripe Dashboard
2. Hent live keys (`pk_live_` / `sk_live_`)
3. Sett opp webhook endpoint i Stripe Dashboard:
   - URL: `https://din-domene.no/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `checkout.session.completed`
4. Kopier webhook signing secret til `STRIPE_WEBHOOK_SECRET`
5. Oppdater miljøvariabler i Vercel/produksjonsmiljø

## Sikkerhet

⚠️ **Viktige sikkerhetsregler:**

1. **Aldri** commit secret keys til git
2. **Aldri** logg eller eksponer secret keys i client-side kode
3. **Bruk** `.env.local` for lokal utvikling (er allerede i `.gitignore`)
4. **Bruk** test keys i dev, live keys kun i produksjon
5. **Rotér** keys hvis de blir eksponert

## Ytterligere ressurser

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
