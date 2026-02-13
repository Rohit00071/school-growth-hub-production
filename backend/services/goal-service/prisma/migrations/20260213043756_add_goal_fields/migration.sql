-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "goal_service"."GoalStatus" ADD VALUE 'ASSIGNED';
ALTER TYPE "goal_service"."GoalStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "goal_service"."Goal" ADD COLUMN     "actionStep" TEXT,
ADD COLUMN     "assignedBy" TEXT,
ADD COLUMN     "ay" TEXT,
ADD COLUMN     "campus" TEXT,
ADD COLUMN     "pillar" TEXT,
ADD COLUMN     "reflectionCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "teacherName" TEXT,
ALTER COLUMN "status" SET DEFAULT 'ASSIGNED';
