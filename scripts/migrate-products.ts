/**
 * Migrate product data from old database (electrohype-db) to new database (bookbright-db)
 * Only migrates Product and ProductVariant models to avoid order/user data
 *
 * Homepage requires: Product + ProductVariant models
 *
 * Run with: OLD_DB_URL="..." NEW_DB_URL="..." npx tsx scripts/migrate-products.ts
 * Dry run: OLD_DB_URL="..." NEW_DB_URL="..." DRY_RUN=true npx tsx scripts/migrate-products.ts
 */

import { PrismaClient } from "@prisma/client";

interface MigrationStats {
  sourceProducts: number;
  sourceVariants: number;
  targetProductsBefore: number;
  targetVariantsBefore: number;
  migratedProducts: number;
  migratedVariants: number;
  skippedProducts: number;
  skippedVariants: number;
}

async function getCounts(prisma: PrismaClient): Promise<{ products: number; variants: number }> {
  const [productCount, variantCount] = await Promise.all([
    prisma.product.count(),
    prisma.productVariant.count(),
  ]);
  return { products: productCount, variants: variantCount };
}

async function main() {
  const oldDbUrl = process.env.OLD_DB_URL;
  const newDbUrl = process.env.NEW_DB_URL;
  const isDryRun = process.env.DRY_RUN === "true";

  if (!oldDbUrl || !newDbUrl) {
    console.error("❌ Missing required environment variables:");
    console.error("   OLD_DB_URL - connection string for source database");
    console.error("   NEW_DB_URL - connection string for target database");
    console.error("   DRY_RUN - optional, set to 'true' for dry run mode");
    console.error("\nExample:");
    console.error("   OLD_DB_URL=\"postgresql://...\" NEW_DB_URL=\"postgresql://...\" npx tsx scripts/migrate-products.ts");
    console.error("   OLD_DB_URL=\"postgresql://...\" NEW_DB_URL=\"postgresql://...\" DRY_RUN=true npx tsx scripts/migrate-products.ts");
    process.exit(1);
  }

  console.log(`🔄 Starting product data migration${isDryRun ? " (DRY RUN MODE)" : ""}...\n`);

  // Create separate Prisma clients for old and new databases
  const oldPrisma = new PrismaClient({
    datasourceUrl: oldDbUrl,
  });

  const newPrisma = new PrismaClient({
    datasourceUrl: newDbUrl,
  });

  const stats: MigrationStats = {
    sourceProducts: 0,
    sourceVariants: 0,
    targetProductsBefore: 0,
    targetVariantsBefore: 0,
    migratedProducts: 0,
    migratedVariants: 0,
    skippedProducts: 0,
    skippedVariants: 0,
  };

  try {
    // Get source database counts
    console.log("📊 Gathering statistics...");
    const sourceCounts = await getCounts(oldPrisma);
    stats.sourceProducts = sourceCounts.products;
    stats.sourceVariants = sourceCounts.variants;

    const targetCountsBefore = await getCounts(newPrisma);
    stats.targetProductsBefore = targetCountsBefore.products;
    stats.targetVariantsBefore = targetCountsBefore.variants;

    console.log(`📈 Source DB: ${stats.sourceProducts} products, ${stats.sourceVariants} variants`);
    console.log(`📈 Target DB: ${stats.targetProductsBefore} products, ${stats.targetVariantsBefore} variants`);

    // Fetch all products from old database
    console.log("\n📖 Reading products from source database...");
    const products = await oldPrisma.product.findMany({
      include: {
        variants: true,
      },
    });

    console.log(`📦 Found ${products.length} products to migrate`);

    // Process each product
    for (const product of products) {
      const { variants, ...productData } = product;

      try {
        if (!isDryRun) {
          // Upsert product using slug as stable key
          await newPrisma.product.upsert({
            where: {
              slug: productData.slug,
            },
            update: productData,
            create: productData,
          });
        }
        stats.migratedProducts++;

        // Process variants for this product
        for (const variant of variants) {
          const { id, productId, ...variantData } = variant;

          try {
            if (!isDryRun) {
              // Upsert variant using sku as stable key (if sku exists)
              if (variantData.sku) {
                await newPrisma.productVariant.upsert({
                  where: {
                    sku: variantData.sku,
                  },
                  update: {
                    ...variantData,
                    productId: productData.id, // Use original product ID for consistency
                  },
                  create: {
                    ...variantData,
                    productId: productData.id,
                  },
                });
              } else {
                // If no sku, create new variant (can't upsert without unique key)
                await newPrisma.productVariant.create({
                  data: {
                    ...variantData,
                    productId: productData.id,
                  },
                });
              }
            }
            stats.migratedVariants++;
          } catch (variantError) {
            console.warn(`⚠️  Skipped variant for product "${productData.name}": ${variantError}`);
            stats.skippedVariants++;
          }
        }

        // Log progress every 10 products
        if (stats.migratedProducts % 10 === 0) {
          console.log(`   Processed ${stats.migratedProducts}/${products.length} products...`);
        }

      } catch (productError) {
        console.warn(`⚠️  Skipped product "${productData.name}": ${productError}`);
        stats.skippedProducts++;
      }
    }

    // Final verification
    const targetCountsAfter = await getCounts(newPrisma);

    console.log("\n✅ Migration completed!");
    console.log("📊 Migration Summary:");
    console.log(`   Source DB had: ${stats.sourceProducts} products, ${stats.sourceVariants} variants`);
    console.log(`   Target DB had: ${stats.targetProductsBefore} products, ${stats.targetVariantsBefore} variants`);
    console.log(`   Migrated: ${stats.migratedProducts} products, ${stats.migratedVariants} variants`);
    console.log(`   Skipped: ${stats.skippedProducts} products, ${stats.skippedVariants} variants`);

    console.log("\n🔍 Final Verification:");
    console.log(`   Target DB now has: ${targetCountsAfter.products} products, ${targetCountsAfter.variants} variants`);

    const expectedProducts = stats.targetProductsBefore + stats.migratedProducts;
    const expectedVariants = stats.targetVariantsBefore + stats.migratedVariants;

    if (targetCountsAfter.products === expectedProducts && targetCountsAfter.variants === expectedVariants) {
      console.log("✅ Counts match expectations!");
    } else {
      console.log("⚠️  Counts don't match - there might be duplicates or data conflicts");
    }

    if (isDryRun) {
      console.log("\n🧪 This was a DRY RUN - no data was actually migrated");
      console.log("   Remove DRY_RUN=true to perform actual migration");
    }

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await oldPrisma.$disconnect();
    await newPrisma.$disconnect();
  }
}

main();
