/*
  Warnings:

  - You are about to drop the column `cvUrl` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `idDocUrl` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitle` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Application` table. All the data in the column will be lost.
  - Added the required column `cvPath` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobId` to the `Application` table without a default value. This is not possible if the table is not empty.
  - Made the column `city` on table `Application` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `Application` required. This step will fail if there are existing NULL values in that column.
  - Made the column `experienceYears` on table `Application` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "experienceYears" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "cvPath" TEXT NOT NULL,
    "idPath" TEXT,
    "jobId" TEXT NOT NULL,
    CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("city", "createdAt", "email", "experienceYears", "fullName", "id", "phone", "status", "trackingCode") SELECT "city", "createdAt", "email", "experienceYears", "fullName", "id", "phone", "status", "trackingCode" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE UNIQUE INDEX "Application_trackingCode_key" ON "Application"("trackingCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
