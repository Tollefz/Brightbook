-- Create hero product in database
-- Run this with: psql $DATABASE_URL -f scripts/create-hero-product.sql
-- Or use Prisma Studio to insert manually

INSERT INTO "Product" (
  id,
  slug,
  sku,
  name,
  "shortDescription",
  description,
  price,
  "compareAtPrice",
  images,
  tags,
  category,
  stock,
  "isActive",
  "isHero",
  specs,
  "createdAt",
  "updatedAt"
) VALUES (
  'hero-led-leseskjerm-001',
  'luminera-led-leseskjerm',
  'LUM-LED-001',
  'LED Leseskjerm for Nattlesing',
  'Les i senga uten å forstyrre andre – mykt og jevnt lys over hele siden',
  'En transparent LED-leseskjerm som gir jevn belysning over hele boksiden. Perfekt for nattlesing uten å forstyrre partneren din. Med varmt, mykt lys, 99-min timer og lang batteritid.',
  599,
  799,
  '["/products/bookbright/BR.avif","/products/bookbright/BR1.avif","/products/bookbright/br3.avif","/products/bookbright/br4.avif","/products/bookbright/br5.avif","/products/bookbright/br6.avif"]',
  'leselys,nattlesing,LED leseskjerm,boklys,lesing i senga',
  'Elektronikk',
  100,
  true,
  true,
  '{"brand":"Luminera","variants":["Svart","Hvit","Rosa"],"features":["Jevn belysning over hele siden","Varmt og mykt lys","99-minutter automatisk timer","Oppladbart med lang batteritid","Forstyrrer ikke partneren","Lett og slank design"]}',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  "isHero" = true,
  "isActive" = true,
  price = 599,
  "compareAtPrice" = 799,
  "updatedAt" = NOW();

