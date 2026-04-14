-- AlterTable
ALTER TABLE "public"."User"
ADD COLUMN "can_create_custom_food" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "email_verified_at" TIMESTAMP(3),
ADD COLUMN "email_verification_token" TEXT,
ADD COLUMN "email_verification_token_expiry" TIMESTAMP(3);
