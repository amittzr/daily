-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "providerName" TEXT,
    "fileUrl" TEXT,
    "carNumber" TEXT,
    "carModel" TEXT,
    "driverAge" INTEGER,
    "noClaimsYears" INTEGER DEFAULT 3,
    "annualCost" DOUBLE PRECISION,
    "expirationDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "documents_userId_idx" ON "documents"("userId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
