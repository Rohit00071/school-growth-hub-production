-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user_service";

-- CreateEnum
CREATE TYPE "observation_service"."ObservationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'COMPLETED');

-- CreateTable
CREATE TABLE "observation_service"."Observation" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "observerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "domain" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" "observation_service"."ObservationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "actionStep" TEXT,
    "teacherReflection" TEXT,
    "discussionMet" BOOLEAN NOT NULL DEFAULT false,
    "hasReflection" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observation_service"."ObservationDomain" (
    "id" TEXT NOT NULL,
    "observationId" TEXT NOT NULL,
    "domainId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "rating" TEXT NOT NULL,
    "evidence" TEXT,

    CONSTRAINT "ObservationDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_service"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Observation_teacherId_date_idx" ON "observation_service"."Observation"("teacherId", "date");

-- CreateIndex
CREATE INDEX "Observation_observerId_date_idx" ON "observation_service"."Observation"("observerId", "date");

-- CreateIndex
CREATE INDEX "Observation_status_idx" ON "observation_service"."Observation"("status");

-- CreateIndex
CREATE INDEX "ObservationDomain_observationId_idx" ON "observation_service"."ObservationDomain"("observationId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "user_service"."User"("email");

-- AddForeignKey
ALTER TABLE "observation_service"."ObservationDomain" ADD CONSTRAINT "ObservationDomain_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "observation_service"."Observation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
