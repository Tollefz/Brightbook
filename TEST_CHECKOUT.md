# Testbetaling (DEV-only)

## Oversikt

Testbetaling lar deg opprette ordre uten faktisk betaling. Dette er nyttig for lokal utvikling når Stripe ikke er konfigurert.

## Aktivering

Legg til i `.env.local`:

```env
NEXT_PUBLIC_CHECKOUT_MODE=test
```

**Viktig:**
- Default i dev: `test` (hvis ikke satt)
- Default i prod: `stripe` (hvis ikke satt)
- Testbetaling er **ikke tilgjengelig i produksjon** (blokkeres av API)

## Hvordan det fungerer

1. **Checkout-siden** sjekker `NEXT_PUBLIC_CHECKOUT_MODE`
2. Hvis `test`: Viser "Fullfør testordre (ingen betaling)" knapp
3. Hvis `stripe`: Viser normale Stripe betalingsalternativer

## Testflyt

1. Gå til `/checkout`
2. Fyll ut kundeinformasjon og leveringsadresse
3. Velg leveringsmetode
4. I betalingsseksjonen:
   - Hvis `CHECKOUT_MODE=test`: Se blå "Fullfør testordre" knapp
   - Hvis `CHECKOUT_MODE=stripe`: Se normale Stripe-alternativer
5. Klikk "Fullfør testordre (ingen betaling)"
6. Ordre opprettes med:
   - `paymentStatus: "paid"` (markert som betalt)
   - `paymentMethod: "stripe"` (for kompatibilitet)
   - Alle OrderItems med `variantId` og `variantName` hvis variant er valgt
7. Redirect til `/order-confirmation?orderId=...&test=true`

## Variant-støtte

Testbetaling støtter fullt variant-systemet:
- Hvis produkt har varianter (f.eks. farger), velg variant på produktsiden
- Variant lagres i cart med `variantId` og `variantName`
- Ved testbetaling sendes variant-data til API
- Ordre opprettes med `variantId` og `variantName` i OrderItems
- Admin viser variant (farge) på ordrelinjer

## Verifisering

Etter testbetaling:

1. **Ordrebekreftelse:**
   - Gå til `/order-confirmation?orderId=...`
   - Sjekk at ordre vises med riktig variant (farge)

2. **Admin:**
   - Gå til `/admin/orders`
   - Finn ordren (søk på ordrenummer eller kunde)
   - Klikk på ordren
   - Sjekk at variant (farge) vises på hver ordrelinje

3. **Database:**
   - Sjekk `Order` tabellen: `paymentStatus = "paid"`
   - Sjekk `OrderItem` tabellen: `variantId` og `variantName` er satt

## Feilsøking

### "Test checkout is not available in production"

- Dette er forventet - testbetaling er blokkert i produksjon
- I dev: Sjekk at `NEXT_PUBLIC_CHECKOUT_MODE=test` er satt

### Ordre opprettes ikke

1. Sjekk server logs for feilmeldinger
2. Sjekk at alle påkrevde felter er fylt ut (email, navn, adresse)
3. Sjekk at cart ikke er tom
4. Sjekk at produkter eksisterer i database

### Variant vises ikke i admin

1. Sjekk at variant faktisk ble valgt på produktsiden
2. Sjekk at `variantId` og `variantName` er sendt i checkout request
3. Sjekk at OrderItem har `variantId` og `variantName` i database
4. Sjekk at admin order detail page henter variantName fra OrderItem

## Sikkerhet

⚠️ **Viktig:**
- Testbetaling er **kun for lokal utvikling**
- API blokkerer testbetaling i produksjon (`NODE_ENV === "production"`)
- I produksjon: Bruk Stripe (`CHECKOUT_MODE=stripe`)

## Eksempel: Full testflyt

1. **Sett miljøvariabel:**
   ```env
   NEXT_PUBLIC_CHECKOUT_MODE=test
   ```

2. **Restart dev-server:**
   ```bash
   npm run dev
   ```

3. **Legg til produkt med variant:**
   - Gå til produktsiden
   - Velg farge (f.eks. "Pink")
   - Legg i handlekurv

4. **Gå til checkout:**
   - Fyll ut kundeinfo: `test@example.com`, `Test Kunde`
   - Fyll ut adresse: `Testveien 1`, `1234`, `Oslo`
   - Velg leveringsmetode
   - Se "Fullfør testordre (ingen betaling)" knapp

5. **Fullfør testordre:**
   - Klikk knappen
   - Venter på redirect
   - Se ordrebekreftelse med ordrenummer

6. **Verifiser i admin:**
   - Gå til `/admin/orders`
   - Finn ordren
   - Sjekk at farge vises: "Produktnavn - Pink"

## Avansert: Variant-administrasjon

For å administrere varianter (farger) i admin:

1. Gå til `/admin/products/edit/[id]`
2. Scroll ned til "Varianter (farge)" seksjon
3. Klikk "Legg til variant"
4. Fyll ut:
   - **Farge/Navn:** f.eks. "Pink", "White", "Black"
   - **Sorteringsrekkefølge:** 0, 1, 2 (lavere tall vises først)
   - **Pris:** (valgfritt, bruker produktpris hvis tom)
   - **Lager:** (valgfritt)
5. Lagre produkt
6. Variantene vises på produktsiden og kan velges av kunder

