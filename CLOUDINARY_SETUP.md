# Cloudinary Setup for Image Uploads

## Environment Variables

Legg til følgende miljøvariabler i `.env` (eller `.env.local`):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Hvordan få Cloudinary-credentials

1. Gå til [Cloudinary Dashboard](https://cloudinary.com/console)
2. Logg inn eller opprett en gratis konto
3. Gå til "Dashboard" → "Account Details"
4. Kopier:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

## Test opplasting lokalt

1. Sett miljøvariablene i `.env.local`
2. Start dev-serveren: `npm run dev`
3. Gå til `/admin/products/new` eller `/admin/products/edit/[id]`
4. Klikk "Last opp bilder fra filer"
5. Velg ett eller flere bilder (maks 10MB per bilde, opptil 10 bilder)
6. Bildene lastes opp til Cloudinary og URL-ene legges automatisk til i produktet

## Funksjoner

- ✅ Drag & drop (via file picker)
- ✅ Multiple file upload (opptil 10 bilder samtidig)
- ✅ Filtype-validering (jpg, png, webp, gif, avif)
- ✅ Størrelsesvalidering (maks 10MB per bilde)
- ✅ Automatisk optimalisering via Cloudinary
- ✅ Bilder lagres i mappen `bookbright/products` på Cloudinary
- ✅ Admin-autentisering påkrevd

## API Endpoint

`POST /api/admin/upload-image`

**Body:** `multipart/form-data` med `files` (array)

**Response:**
```json
{
  "urls": [
    "https://res.cloudinary.com/.../bookbright/products/...",
    "..."
  ]
}
```

## Feilsøking

Hvis opplasting feiler:
1. Sjekk at alle tre miljøvariabler er satt
2. Sjekk at Cloudinary-credentials er korrekte
3. Sjekk browser console for feilmeldinger
4. Sjekk server logs for detaljerte feilmeldinger

