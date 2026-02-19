-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackingCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'EN_COURS',
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "city" TEXT,
    "jobTitle" TEXT NOT NULL,
    "experienceYears" TEXT,
    "cvUrl" TEXT,
    "idDocUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_trackingCode_key" ON "Application"("trackingCode");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_jobTitle_idx" ON "Application"("jobTitle");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");
