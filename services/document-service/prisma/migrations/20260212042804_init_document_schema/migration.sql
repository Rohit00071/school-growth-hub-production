-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user_service";

-- CreateEnum
CREATE TYPE "document_service"."AcknowledgementStatus" AS ENUM ('PENDING', 'VIEWED', 'ACKNOWLEDGED');

-- CreateTable
CREATE TABLE "document_service"."Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hash" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_service"."DocumentAcknowledgement" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "status" "document_service"."AcknowledgementStatus" NOT NULL DEFAULT 'PENDING',
    "viewedAt" TIMESTAMP(3),
    "acknowledgedAt" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "receiptUrl" TEXT,
    "documentHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentAcknowledgement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_service"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_createdById_idx" ON "document_service"."Document"("createdById");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "document_service"."Document"("createdAt");

-- CreateIndex
CREATE INDEX "DocumentAcknowledgement_teacherId_idx" ON "document_service"."DocumentAcknowledgement"("teacherId");

-- CreateIndex
CREATE INDEX "DocumentAcknowledgement_documentId_idx" ON "document_service"."DocumentAcknowledgement"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentAcknowledgement_documentId_teacherId_key" ON "document_service"."DocumentAcknowledgement"("documentId", "teacherId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "user_service"."User"("email");

-- AddForeignKey
ALTER TABLE "document_service"."DocumentAcknowledgement" ADD CONSTRAINT "DocumentAcknowledgement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document_service"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
