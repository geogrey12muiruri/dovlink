/*
  Warnings:

  - The values [PART] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `reason` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `patient_id` on the `Diagnosis` table. All the data in the column will be lost.
  - You are about to drop the column `allergies` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `blood_group` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `emergency_contact_name` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `emergency_contact_number` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `insurance_number` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `insurance_provider` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `medical_conditions` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `medical_history` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `relation` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `bill_id` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `patient_id` on the `VitalSigns` table. All the data in the column will be lost.
  - You are about to drop the `LabTest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MedicalRecords` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[receipt_number]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('MEDICATION', 'LAB', 'IMAGING', 'REFERRAL', 'PROCEDURE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Gender" ADD VALUE 'UNKNOWN';
ALTER TYPE "Gender" ADD VALUE 'OTHER';

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PAID', 'UNPAID', 'PARTIAL');
ALTER TABLE "Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'UNPAID';
COMMIT;

-- DropForeignKey
ALTER TABLE "Diagnosis" DROP CONSTRAINT "Diagnosis_doctor_id_fkey";

-- DropForeignKey
ALTER TABLE "Diagnosis" DROP CONSTRAINT "Diagnosis_medical_id_fkey";

-- DropForeignKey
ALTER TABLE "LabTest" DROP CONSTRAINT "LabTest_record_id_fkey";

-- DropForeignKey
ALTER TABLE "LabTest" DROP CONSTRAINT "LabTest_service_id_fkey";

-- DropForeignKey
ALTER TABLE "MedicalRecords" DROP CONSTRAINT "MedicalRecords_appointment_id_fkey";

-- DropForeignKey
ALTER TABLE "MedicalRecords" DROP CONSTRAINT "MedicalRecords_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "VitalSigns" DROP CONSTRAINT "VitalSigns_medical_id_fkey";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "reason";

-- AlterTable
ALTER TABLE "Diagnosis" DROP COLUMN "patient_id";

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "allergies",
DROP COLUMN "blood_group",
DROP COLUMN "emergency_contact_name",
DROP COLUMN "emergency_contact_number",
DROP COLUMN "insurance_number",
DROP COLUMN "insurance_provider",
DROP COLUMN "medical_conditions",
DROP COLUMN "medical_history",
DROP COLUMN "relation",
ALTER COLUMN "gender" SET DEFAULT 'UNKNOWN',
ALTER COLUMN "marital_status" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "bill_id",
ALTER COLUMN "payment_date" DROP NOT NULL,
ALTER COLUMN "discount" SET DEFAULT 0,
ALTER COLUMN "amount_paid" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "VitalSigns" DROP COLUMN "patient_id",
ALTER COLUMN "body_temperature" DROP NOT NULL,
ALTER COLUMN "systolic" DROP NOT NULL,
ALTER COLUMN "diastolic" DROP NOT NULL,
ALTER COLUMN "heartRate" DROP NOT NULL,
ALTER COLUMN "weight" DROP NOT NULL,
ALTER COLUMN "height" DROP NOT NULL;

-- DropTable
DROP TABLE "LabTest";

-- DropTable
DROP TABLE "MedicalRecords";

-- CreateTable
CREATE TABLE "Coding" (
    "id" SERIAL NOT NULL,
    "system" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "display" TEXT,
    "order_id" INTEGER,
    "condition_id" INTEGER,
    "allergy_id" INTEGER,
    "diagnosis_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Identifier" (
    "id" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "system" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Identifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "onset_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "substance" TEXT NOT NULL,
    "reaction" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insurance" (
    "id" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "encounter_id" INTEGER,
    "order_type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "details" JSONB,
    "priority" TEXT,
    "created_by" TEXT NOT NULL,
    "fulfilled_by" TEXT,
    "cancelled_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationOrder" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "medication" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "duration" TEXT,
    "dispense_qty" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOrder" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "test_name" TEXT NOT NULL,
    "specimen" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" SERIAL NOT NULL,
    "lab_order_id" INTEGER NOT NULL,
    "result" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagingOrder" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "procedure" TEXT NOT NULL,
    "body_site" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImagingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" SERIAL NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" INTEGER NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "treatment_plan" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CodingToMedicationOrder" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CodingToMedicationOrder_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CodingToLabOrder" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CodingToLabOrder_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CodingToLabResult" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CodingToLabResult_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CodingToImagingOrder" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CodingToImagingOrder_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CodingToVitalSigns" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CodingToVitalSigns_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicationOrder_order_id_key" ON "MedicationOrder"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "LabOrder_order_id_key" ON "LabOrder"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "LabResult_lab_order_id_key" ON "LabResult"("lab_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "ImagingOrder_order_id_key" ON "ImagingOrder"("order_id");

-- CreateIndex
CREATE INDEX "_CodingToMedicationOrder_B_index" ON "_CodingToMedicationOrder"("B");

-- CreateIndex
CREATE INDEX "_CodingToLabOrder_B_index" ON "_CodingToLabOrder"("B");

-- CreateIndex
CREATE INDEX "_CodingToLabResult_B_index" ON "_CodingToLabResult"("B");

-- CreateIndex
CREATE INDEX "_CodingToImagingOrder_B_index" ON "_CodingToImagingOrder"("B");

-- CreateIndex
CREATE INDEX "_CodingToVitalSigns_B_index" ON "_CodingToVitalSigns"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receipt_number_key" ON "Payment"("receipt_number");

-- AddForeignKey
ALTER TABLE "Coding" ADD CONSTRAINT "Coding_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coding" ADD CONSTRAINT "Coding_condition_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "Condition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coding" ADD CONSTRAINT "Coding_allergy_id_fkey" FOREIGN KEY ("allergy_id") REFERENCES "Allergy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coding" ADD CONSTRAINT "Coding_diagnosis_id_fkey" FOREIGN KEY ("diagnosis_id") REFERENCES "Diagnosis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Identifier" ADD CONSTRAINT "Identifier_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insurance" ADD CONSTRAINT "Insurance_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "MedicalRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationOrder" ADD CONSTRAINT "MedicationOrder_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_lab_order_id_fkey" FOREIGN KEY ("lab_order_id") REFERENCES "LabOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImagingOrder" ADD CONSTRAINT "ImagingOrder_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSigns" ADD CONSTRAINT "VitalSigns_medical_id_fkey" FOREIGN KEY ("medical_id") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_medical_id_fkey" FOREIGN KEY ("medical_id") REFERENCES "MedicalRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CodingToMedicationOrder" ADD CONSTRAINT "_CodingToMedicationOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "Coding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CodingToMedicationOrder" ADD CONSTRAINT "_CodingToMedicationOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "MedicationOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CodingToLabOrder" ADD CONSTRAINT "_CodingToLabOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "Coding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CodingToLabOrder" ADD CONSTRAINT "_CodingToLabOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "LabOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CodingToLabResult" ADD CONSTRAINT "_CodingToLabResult_A_fkey" FOREIGN KEY ("A") REFERENCES "Coding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CodingToLabResult" ADD CONSTRAINT "_CodingToLabResult_B_fkey" FOREIGN KEY ("B") REFERENCES "LabResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CodingToImagingOrder" ADD CONSTRAINT "_CodingToImagingOrder_A_fkey" FOREIGN KEY ("A") REFERENCES "Coding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CodingToImagingOrder" ADD CONSTRAINT "_CodingToImagingOrder_B_fkey" FOREIGN KEY ("B") REFERENCES "ImagingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CodingToVitalSigns" ADD CONSTRAINT "_CodingToVitalSigns_A_fkey" FOREIGN KEY ("A") REFERENCES "Coding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CodingToVitalSigns" ADD CONSTRAINT "_CodingToVitalSigns_B_fkey" FOREIGN KEY ("B") REFERENCES "VitalSigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
