-- Link rekber transactions to inspection orders (bundle flow)
ALTER TABLE "RekberTransaction" ADD COLUMN "inspectionOrderId" TEXT;

CREATE UNIQUE INDEX "RekberTransaction_inspectionOrderId_key" ON "RekberTransaction"("inspectionOrderId");

ALTER TABLE "RekberTransaction" ADD CONSTRAINT "RekberTransaction_inspectionOrderId_fkey" FOREIGN KEY ("inspectionOrderId") REFERENCES "InspectionOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
