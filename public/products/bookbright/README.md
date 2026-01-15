# BookBright Produktbilder

Denne mappen skal inneholde produktbildene for BookBright LED Leseskjerm.

## Nødvendige filer

Legg følgende bilder i denne mappen med **eksakt** filnavn (case-sensitive):

- `BR.avif` (stor B, stor R)
- `BR1.avif` (stor B, stor R, 1)
- `br3.avif` (liten b, liten r, 3)
- `br4.avif` (liten b, liten r, 4)
- `br5.avif` (liten b, liten r, 5)
- `br6.avif` (liten b, liten r, 6)

## Verifisering

Etter at bildene er lagt til, kan du verifisere at de fungerer:

1. **Test direkte URL:**
   - Åpne `http://localhost:3000/products/bookbright/BR.avif` i nettleseren
   - Skal vise bildet (ikke 404)

2. **Test debug-endpoint:**
   - Åpne `http://localhost:3000/api/debug-assets` i nettleseren
   - Skal returnere `success: true` og alle filer som `exists: true`

3. **Test landing-siden:**
   - Åpne `/` (forsiden)
   - Hero-bilde og thumbnails skal vises
   - Ingen console errors

## Filstruktur

```
public/
  products/
    bookbright/
      BR.avif      ← Hovedbilde (hero)
      BR1.avif     ← Sidevisning
      br3.avif     ← I bruk
      br4.avif     ← Detalj
      br5.avif     ← Nattlesing
      br6.avif     ← Lukket
```

## Viktig

- Filnavn må matches **nøyaktig** (case-sensitive)
- Alle filer må være `.avif` format
- Filene må ligge direkte i `public/products/bookbright/` mappen

