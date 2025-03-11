import React from "react";
import { BookAppointment } from "./forms/book-appointment";
import { getPatientById } from "@/utils/services/patient";
import { getDoctors } from "@/utils/services/doctor";

export const AppointmentContainer = async ({ id }: { id: string }) => {
  const patientResult = await getPatientById(id);
  const doctorsResult = await getDoctors();

  // Log the full results for debugging
  console.log("Patient result:", patientResult);
  console.log("Doctors result:", doctorsResult);

  if (!patientResult.success || !patientResult.data) {
    return <div>Error: Patient not found</div>;
  }

  if (!doctorsResult.success || !doctorsResult.data) {
    return <div>Error: Doctors not found</div>;
  }

  return (
    <div>
      <BookAppointment data={patientResult.data} doctors={doctorsResult.data} />
    </div>
  );
};