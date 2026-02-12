-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "notification_service";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user_service";

-- CreateEnum
CREATE TYPE "notification_service"."NotificationType" AS ENUM ('SYSTEM', 'OBSERVATION', 'GOAL', 'DOCUMENT', 'ANNOUNCEMENT');

-- CreateTable
CREATE TABLE "notification_service"."Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "notification_service"."NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_service"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "notification_service"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "notification_service"."Notification"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "user_service"."User"("email");
