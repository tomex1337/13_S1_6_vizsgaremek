-- AlterTable
ALTER TABLE "public"."FoodItem" ADD COLUMN "barcode" TEXT;

-- CreateIndex
CREATE INDEX "FoodItem_barcode_idx" ON "public"."FoodItem"("barcode");
