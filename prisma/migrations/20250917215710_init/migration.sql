-- CreateEnum
CREATE TYPE "Language" AS ENUM ('EN', 'PT');

-- CreateEnum
CREATE TYPE "VisitSource" AS ENUM ('CODE', 'QR', 'DESK');

-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('ACTIVE', 'REDEEMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MenuCategory" AS ENUM ('FOOD', 'DRINKS');

-- CreateEnum
CREATE TYPE "SubscriptionTopic" AS ENUM ('EVENTS', 'PROMOS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ON', 'OFF');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'CASHIER');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('SYSTEM', 'STAFF');

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "waId" TEXT,
    "lang" "Language" NOT NULL DEFAULT 'EN',
    "client_code" TEXT NOT NULL,
    "kidsCount" INTEGER,
    "consent_marketing" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "source" "VisitSource" NOT NULL,
    "staff_id" TEXT,
    "shift_id" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loyalty_counters" (
    "family_id" TEXT NOT NULL,
    "current_cycle_count" INTEGER NOT NULL DEFAULT 0,
    "total_visits" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "loyalty_counters_pkey" PRIMARY KEY ("family_id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'ACTIVE',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "redeemed_at" TIMESTAMP(3),
    "redeemed_by_staff_id" TEXT,
    "signature" TEXT NOT NULL,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "name_pt" TEXT NOT NULL,
    "desc_en" TEXT,
    "desc_pt" TEXT,
    "price_cents" INTEGER NOT NULL,
    "category" "MenuCategory" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "topic" "SubscriptionTopic" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ON',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_codes" (
    "id" TEXT NOT NULL,
    "family_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "staff_id" TEXT,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_type" "ActorType" NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "families_phone_key" ON "families"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "families_waId_key" ON "families"("waId");

-- CreateIndex
CREATE UNIQUE INDEX "families_client_code_key" ON "families"("client_code");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_code_key" ON "vouchers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_sku_key" ON "menu_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_family_id_topic_key" ON "subscriptions"("family_id", "topic");

-- CreateIndex
CREATE UNIQUE INDEX "staff_email_key" ON "staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "visit_codes_code_key" ON "visit_codes"("code");

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loyalty_counters" ADD CONSTRAINT "loyalty_counters_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_redeemed_by_staff_id_fkey" FOREIGN KEY ("redeemed_by_staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_codes" ADD CONSTRAINT "visit_codes_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_codes" ADD CONSTRAINT "visit_codes_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
