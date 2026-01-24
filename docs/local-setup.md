# Local Setup Guide

## Quick Start

Følg disse stegene for å sette opp prosjektet lokalt.

## 1. Forutsetninger

- **Node.js 18+** - [Last ned her](https://nodejs.org/)
- **npm** eller **yarn** - Kommer med Node.js
- **Neon PostgreSQL database** - [Opprett gratis konto](https://neon.tech)
- **Git** - For å klone repositoriet

## 2. Klon og installer

```bash
# Klon repositoriet
git clone <repo-url>
cd ElectryoHype

# Installer avhengigheter
npm install
```

## 3. Opprett .env fil

Opprett en `.env` fil i prosjektroten med følgende variabler:

```env
# ⚠️ PÅKREVD - Database connection (Pooled)
# For Neon: Use connection string with "-pooler" in hostname
# Example: postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/db?sslmode=require
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"

# ⚠️ PÅKREVD - Database connection (Direct)
# For Neon: Use connection string WITHOUT "-pooler" in hostname
# Example: postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require
# 
# Why both are needed:
# - DATABASE_URL (pooled): Optimized for serverless/production, handles connection pooling
# - DIRECT_URL (direct): Required for Prisma migrations and schema operations
# 
# To get both from Neon Dashboard:
# 1. Go to Connection Details
# 2. Copy "Pooled connection" → DATABASE_URL
# 3. Copy "Direct connection" → DIRECT_URL
DIRECT_URL="postgresql://user:password@host/database?sslmode=require"

# ⚠️ PÅKREVD - Store configuration
DEFAULT_STORE_ID="default-store"

# ⚠️ PÅKREVD - NextAuth configuration
NEXTAUTH_SECRET="din-super-hemmelige-nøkkel-her-minst-32-tegn"
NEXTAUTH_URL="http://localhost:3000"

# Valgfritt - Stripe (for betalinger)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Valgfritt - Email (Resend)
RESEND_API_KEY="re_..."

# Valgfritt - UploadThing (for bildeopplasting)
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="..."
```

## 4. Hvordan få DATABASE_URL

### Fra Neon Dashboard:

1. **Logg inn på [Neon Dashboard](https://console.neon.tech)**
2. **Velg ditt prosjekt** (eller opprett et nytt)
3. **Gå til "Connection Details"**
4. **Kopier "Connection string"** (bruk **pooler** versjonen for produksjon)
5. **Lim inn i `.env` som `DATABASE_URL`**

**Eksempel (Neon):**
```
# Pooled connection (for app queries)
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/db?sslmode=require"

# Direct connection (for migrations)
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require"
```

**💡 Hvorfor begge trengs:**
- **DATABASE_URL (pooled)**: Optimal for serverless miljøer som Vercel. Håndterer connection pooling automatisk.
- **DIRECT_URL (direct)**: Påkrevd for Prisma migrasjoner (`prisma migrate deploy`) og schema-operasjoner.

**I Neon Dashboard:**
- "Pooled connection" → kopier til `DATABASE_URL`
- "Direct connection" → kopier til `DIRECT_URL`

### For lokal utvikling:

Du kan også bruke en lokal PostgreSQL database:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/electrohype?sslmode=disable"
```

## 5. Sett opp databasen

```bash
# Generer Prisma Client
npx prisma generate

# Kjør migrasjoner (oppretter tabeller)
npx prisma migrate dev

# Seed database med demo-data (valgfritt)
npm run seed
```

## 6. Start utviklingsserver

```bash
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) i nettleseren.

## Feilsøking

### PrismaClientInitializationError

Hvis du får denne feilen, sjekk:

1. **DATABASE_URL mangler eller er feil**
   ```bash
   # Sjekk at .env filen eksisterer
   ls -la .env
   
   # Sjekk at DATABASE_URL er satt
   cat .env | grep DATABASE_URL
   ```

2. **Database er ikke tilgjengelig**
   - Sjekk Neon Dashboard at databasen er aktiv
   - Sjekk at connection string er korrekt
   - Prøv å koble til manuelt med `psql` eller database-klient

3. **Prisma Client er ikke generert**
   ```bash
   npx prisma generate
   ```

4. **Migrasjoner mangler**
   ```bash
   npx prisma migrate dev
   ```

### Vanlige feilmeldinger

#### "Missing DATABASE_URL"
- **Årsak:** `.env` fil mangler eller `DATABASE_URL` er ikke satt
- **Fix:** Opprett `.env` fil og legg til `DATABASE_URL`

#### "Can't reach database server"
- **Årsak:** Database er ikke tilgjengelig eller connection string er feil
- **Fix:** Sjekk Neon Dashboard og connection string

#### "Authentication failed"
- **Årsak:** Feil brukernavn/passord i `DATABASE_URL`
- **Fix:** Oppdater credentials i Neon Dashboard og oppdater `DATABASE_URL`

#### "Database does not exist"
- **Årsak:** Database-navn i `DATABASE_URL` er feil
- **Fix:** Sjekk database-navn i Neon Dashboard

#### "Environment variable not found: DIRECT_URL"
- **Årsak:** `DIRECT_URL` mangler i `.env` eller Vercel environment variables
- **Fix:** 
  1. Legg til `DIRECT_URL` i `.env` (lokalt)
  2. Legg til `DIRECT_URL` i Vercel → Settings → Environment Variables (produksjon)
  3. Kopier "Direct connection" fra Neon Dashboard (uten `-pooler` i hostname)
  4. Se [Prisma + Neon Setup Guide](./prisma-neon-setup.md) for detaljer

#### "DEFAULT_STORE_ID is not set"
- **Årsak:** `DEFAULT_STORE_ID` mangler i `.env`
- **Fix:** Legg til `DEFAULT_STORE_ID="default-store"` i `.env`

## Minimum Environment Variables

For å starte appen lokalt, trenger du **minst**:

```env
# Database connections (begge påkrevd for Neon)
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/db?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require"

DEFAULT_STORE_ID="default-store"
NEXTAUTH_SECRET="minst-32-tegn-lang-nøkkel"
NEXTAUTH_URL="http://localhost:3000"
```

**Merk:** 
- Uten disse vil appen ikke starte eller fungere korrekt
- `DIRECT_URL` er påkrevd for Prisma migrasjoner (`prisma migrate deploy`)
- Se [Prisma + Neon Setup Guide](./prisma-neon-setup.md) for detaljer

## Verifisering

Etter setup, verifiser at alt fungerer:

1. **Sjekk at serveren starter:**
   ```bash
   npm run dev
   # Skal se: "Ready on http://localhost:3000"
   ```

2. **Sjekk at database er tilkoblet:**
   - Gå til http://localhost:3000
   - Hvis du ser produkter, fungerer database-tilkoblingen

3. **Sjekk Prisma:**
   ```bash
   npx prisma studio
   # Åpner Prisma Studio i nettleseren
   ```

## Neste steg

- [Teknisk oversikt](./technical-overview.md)
- [Bulk Import Guide](./bulk-import-guide.md)
- [README](../README.md)

