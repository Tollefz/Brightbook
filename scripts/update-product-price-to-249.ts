import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the hero product
  const heroProduct = await prisma.product.findFirst({
    where: { 
      isHero: true,
      OR: [
        { slug: "luminera-led-leseskjerm" },
        { name: { contains: "LED" } }
      ]
    },
    include: {
      variants: true,
    },
  });

  if (!heroProduct) {
    console.log("❌ Hero product not found");
    return;
  }

  console.log(`📦 Found product: ${heroProduct.name} (ID: ${heroProduct.id})`);
  console.log(`   Current price: ${heroProduct.price},-`);
  console.log(`   Variants: ${heroProduct.variants.length}`);

  // Update product price to 249
  await prisma.product.update({
    where: { id: heroProduct.id },
    data: {
      price: 249,
      compareAtPrice: null, // Remove compare price
      name: "LED Lampe", // Update name
    },
  });

  console.log("✅ Product updated: price = 249,-, compareAtPrice = null, name = 'LED Lampe'");

  // Update all variants to 249
  if (heroProduct.variants.length > 0) {
    await prisma.productVariant.updateMany({
      where: { productId: heroProduct.id },
      data: {
        price: 249,
        compareAtPrice: null, // Remove compare price
      },
    });
    console.log(`✅ Updated ${heroProduct.variants.length} variants to price 249,-`);
  }

  // Verify
  const updated = await prisma.product.findUnique({
    where: { id: heroProduct.id },
    include: { variants: true },
  });

  if (updated) {
    console.log(`\n✅ Verification:`);
    console.log(`   Name: ${updated.name}`);
    console.log(`   Price: ${updated.price},-`);
    console.log(`   Compare at: ${updated.compareAtPrice || 'null'}`);
    console.log(`   Variants:`);
    updated.variants.forEach((v) => {
      console.log(`     - ${v.name}: ${v.price},- (compare: ${v.compareAtPrice || 'null'})`);
    });
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

