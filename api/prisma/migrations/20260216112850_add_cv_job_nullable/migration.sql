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
    "status" TEXT NOT NULL DEFAULT 'EN_COURS',
    "trackingCode" TEXT NOT NULL,
    "cvPath" TEXT NOT NULL,
    "idPath" TEXT,
    "jobId" TEXT NOT NULL,
    CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("city", "createdAt", "cvPath", "email", "experienceYears", "fullName", "id", "idPath", "jobId", "phone", "status", "trackingCode") SELECT "city", "createdAt", "cvPath", "email", "experienceYears", "fullName", "id", "idPath", "jobId", "phone", "status", "trackingCode" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE UNIQUE INDEX "Application_trackingCode_key" ON "Application"("trackingCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
