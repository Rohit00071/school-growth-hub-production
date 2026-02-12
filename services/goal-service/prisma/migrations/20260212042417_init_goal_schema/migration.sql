-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "user_service";

-- CreateEnum
CREATE TYPE "goal_service"."GoalStatus" AS ENUM ('IN_PROGRESS', 'NEAR_COMPLETION', 'COMPLETED', 'ON_HOLD');

-- CreateTable
CREATE TABLE "goal_service"."Goal" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "goal_service"."GoalStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "isSchoolAligned" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_service"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_teacherId_idx" ON "goal_service"."Goal"("teacherId");

-- CreateIndex
CREATE INDEX "Goal_status_idx" ON "goal_service"."Goal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "user_service"."User"("email");
