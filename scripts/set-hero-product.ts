import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Set a product as hero product by slug
 * Usage: npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/set-hero-product.ts <product-slug>
 * Example: npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/set-hero-product.ts luminera-led-leseskjerm
 */
async function main() {
  const slug = process.argv[2];

  if (!slug) {
    console.error("❌ Usage: npx ts-node scripts/set-hero-product.ts <product-slug>");
    console.error("   Example: npx ts-node scripts/set-hero-product.ts luminera-led-leseskjerm");
    process.exit(1);
  }

  try {
    // First, unset all existing hero products
    await prisma.product.updateMany({
      where: { isHero: true },
      data: { isHero: false },
    });
    console.log("✅ Unset all existing hero products");

    // Find product by slug
    const product = await prisma.product.findUnique({
      where: { slug },
    });

    if (!product) {
      console.error(`❌ Product with slug "${slug}" not found`);
      console.log("\nAvailable products:");
      const products = await prisma.product.findMany({
        where: { isActive: true },
        select: { slug: true, name: true, isHero: true },
        take: 10,
      });
      products.forEach((p) => {
        console.log(`  - ${p.slug} (${p.name})${p.isHero ? " [CURRENT HERO]" : ""}`);
      });
      process.exit(1);
    }

    // Set as hero
    const updated = await prisma.product.update({
      where: { slug },
      data: { isHero: true },
    });

    console.log(`✅ Set "${updated.name}" (${updated.slug}) as hero product`);
    console.log(`   Price: ${updated.price},-`);
    console.log(`   Active: ${updated.isActive}`);
    console.log(`   Hero: ${updated.isHero}`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

