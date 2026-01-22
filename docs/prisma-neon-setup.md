# Prisma + Neon PostgreSQL Setup

## Oversikt

Dette dokumentet forklarer hvordan du konfigurerer Prisma med Neon PostgreSQL, spesielt hvorfor både `DATABASE_URL` og `DIRECT_URL` er nødvendig.

## Hvorfor to connection strings?

Neon PostgreSQL tilbyr to typer connections:

### 1. Pooled Connection (`DATABASE_URL`)
- **Brukes for:** Applikasjonsqueries i produksjon
- **Fordeler:** 
  - Optimal for serverless miljøer (Vercel, AWS Lambda)
  - Håndterer connection pooling automatisk
  - Reduserer connection overhead
- **Hostname:** Inneholder `-pooler` (f.eks. `ep-xxx-pooler.us-east-1.aws.neon.tech`)

### 2. Direct Connection (`DIRECT_URL`)
- **Brukes for:** Prisma migrasjoner og schema-operasjoner
- **Påkrevd for:**
  - `prisma migrate deploy`
  - `prisma migrate dev`
  - `prisma db push`
  - Schema introspection
- **Hostname:** Inneholder IKKE `-pooler` (f.eks. `ep-xxx.us-east-1.aws.neon.tech`)

## Hvordan få connection strings fra Neon

1. **Logg inn på [Neon Dashboard](https://console.neon.tech)**
2. **Velg ditt prosjekt**
3. **Gå til "Connection Details"**
4. **Kopier begge connection strings:**
   - "Pooled connection" → `DATABASE_URL`
   - "Direct connection" → `DIRECT_URL`

## Eksempel .env

```env
# Pooled connection (for app queries)
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/bookbright-db?sslmode=require"

# Direct connection (for migrations)
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/bookbright-db?sslmode=require"
```

## Feilmeldinger og løsninger

### "Environment variable not found: DIRECT_URL"

**Årsak:** `DIRECT_URL` mangler i `.env` eller Vercel environment variables.

**Løsning:**
1. Legg til `DIRECT_URL` i `.env` (lokalt)
2. Legg til `DIRECT_URL` i Vercel → Settings → Environment Variables (produksjon)
3. Kopier "Direct connection" fra Neon Dashboard

### "Prisma migrate deploy" feiler

**Årsak:** `DIRECT_URL` er ikke satt eller er feil.

**Løsning:**
1. Verifiser at `DIRECT_URL` er satt korrekt
2. Sjekk at hostname IKKE inneholder `-pooler`
3. Test connection manuelt:
   ```bash
   psql "postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require"
   ```

## Vercel Deployment

Når du deployer til Vercel, må du legge til BEGGE environment variables:

1. Gå til Project → Settings → Environment Variables
2. Legg til:
   - `DATABASE_URL` = Pooled connection
   - `DIRECT_URL` = Direct connection

**Viktig:** Vercel bruker `DIRECT_URL` under build for å kjøre `prisma migrate deploy`.

## Lokal utvikling

For lokal utvikling kan du bruke samme connection string for begge (ikke optimalt, men fungerer):

```env
DATABASE_URL="postgresql://user:password@ep-xxx-pooler.us-east-1.aws.neon.tech/db?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/db?sslmode=require"
```

**Anbefaling:** Bruk alltid riktig connection type for best ytelse og kompatibilitet.

## Prisma Schema

I `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooled connection
  directUrl = env("DIRECT_URL")       // Direct connection
}
```

Begge er påkrevd for Neon PostgreSQL med Prisma v6.

## Testing

Test at begge connections fungerer:

```bash
# Test pooled connection (DATABASE_URL)
npx prisma db execute --stdin <<< "SELECT 1"

# Test direct connection (DIRECT_URL)
npx prisma migrate deploy
```

Begge kommandoer skal kjøre uten feil hvis connection strings er korrekt konfigurert.

