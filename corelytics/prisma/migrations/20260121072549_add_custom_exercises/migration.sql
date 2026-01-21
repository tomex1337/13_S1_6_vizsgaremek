-- AlterTable
ALTER TABLE "public"."Exercise" ADD COLUMN     "created_by" UUID,
ADD COLUMN     "is_custom" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "public"."Exercise" ADD CONSTRAINT "Exercise_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
