import db from "@/lib/db";
import React from "react";
import { MedicalHistory } from "./medical-history";

interface DataProps {
  id?: number | string;
  patientId: string;
}

export const MedicalHistoryContainer = async ({ id, patientId }: DataProps) => {
  // Check if db.medicalRecord exists (optional, for safety)
  if (!db.medicalRecord) {
    console.error("medicalRecord is not defined in the database schema.");
    return <div>Error: medicalRecord is not defined in the database schema.</div>;
  }

  const data = await db.medicalRecord.findMany({
    where: { patient_id: patientId },
    include: {
      diagnosis: { include: { doctor: true } },
      // Note: "lab_test" is not defined in the schema; see below for clarification
    },
    orderBy: { created_at: "desc" },
  });

  return (
    <>
      <MedicalHistory data={data} isShowProfile={false} />
    </>
  );
};