import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const heroProductData = {
    slug: "luminera-led-leseskjerm",
    sku: "LUM-LED-001",
    name: "LED Lampe",
    shortDescription: "Les i senga uten å forstyrre andre – mykt og jevnt lys over hele siden",
    description: "En transparent LED-leseskjerm som gir jevn belysning over hele boksiden. Perfekt for nattlesing uten å forstyrre partneren din. Med varmt, mykt lys, 99-min timer og lang batteritid.",
    price: 249,
    compareAtPrice: null, // No compare price
    images: JSON.stringify([
      "/products/bookbright/BR.avif",
      "/products/bookbright/BR1.avif",
      "/products/bookbright/br3.avif",
      "/products/bookbright/br4.avif",
      "/products/bookbright/br5.avif",
      "/products/bookbright/br6.avif",
    ]) as any, // Prisma expects string for images field
    tags: "leselys,nattlesing,LED leseskjerm,boklys,lesing i senga",
    category: "Elektronikk",
    stock: 100,
    isActive: true,
    isHero: true,
    specs: {
      brand: "Luminera",
      variants: ["Svart", "Hvit", "Rosa"],
      features: [
        "Jevn belysning over hele siden",
        "Varmt og mykt lys",
        "99-minutter automatisk timer",
        "Oppladbart med lang batteritid",
        "Forstyrrer ikke partneren",
        "Lett og slank design",
      ],
    },
  };

  // Check if product already exists
  const existing = await prisma.product.findUnique({
    where: { slug: heroProductData.slug },
  });

  if (existing) {
    console.log("✅ Product already exists, updating...");
    const updated = await prisma.product.update({
      where: { slug: heroProductData.slug },
      data: {
        ...heroProductData,
        isHero: true, // Ensure isHero is set
      },
    });
    console.log(`✅ Product updated: ${updated.name} (ID: ${updated.id})`);
  } else {
    console.log("📦 Creating hero product...");
    const product = await prisma.product.create({
      data: heroProductData,
    });
    console.log(`✅ Product created: ${product.name} (ID: ${product.id})`);
  }

  // Verify
  const heroProduct = await prisma.product.findFirst({
    where: { isHero: true, isActive: true },
  });

  if (heroProduct) {
    console.log(`\n✅ Hero product verified: ${heroProduct.name}`);
    console.log(`   Slug: ${heroProduct.slug}`);
    console.log(`   Price: ${heroProduct.price},-`);
    console.log(`   Compare at: ${heroProduct.compareAtPrice},-`);
  } else {
    console.log("\n⚠️  No hero product found!");
  }
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

