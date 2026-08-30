-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrenceIntervalDays" INTEGER DEFAULT 1;
