-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isHero" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Product_isHero_idx" ON "Product"("isHero");
