-- CreateTable
CREATE TABLE "AlertSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "webhookEnabled" BOOLEAN NOT NULL DEFAULT true,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "adjustmentThresholdUsd" DECIMAL(12,2),
    "disabledAlertTypes" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "AlertSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AlertSettings" ADD CONSTRAINT "AlertSettings_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default row
INSERT INTO "AlertSettings" ("id", "alertsEnabled", "emailEnabled", "webhookEnabled", "disabledAlertTypes", "updatedAt")
VALUES ('default', true, true, true, '[]', CURRENT_TIMESTAMP);
