-- Optional property video
ALTER TABLE "properties" ADD COLUMN "videoUrl" TEXT;

-- Property review notifications
ALTER TYPE "NotificationType" ADD VALUE 'PROPERTY_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'PROPERTY_REJECTED';
