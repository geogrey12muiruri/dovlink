"use server";

import db from "@/lib/db";
import { PatientFormSchema } from "@/lib/schema";
import { clerkClient } from "@clerk/nextjs/server";

export async function updatePatient(data: any, pid: string) {
  try {
    const validateData = PatientFormSchema.safeParse(data);

    if (!validateData.success) {
      return {
        success: false,
        error: true,
        msg: "Provide all required fields",
      };
    }

    const patientData = validateData.data;

    const client = await clerkClient();
    await client.users.updateUser(pid, {
      firstName: patientData.first_name,
      lastName: patientData.last_name,
    });

    await db.patient.update({
      data: {
        ...patientData,
      },
      where: { id: pid },
    });

    return {
      success: true,
      error: false,
      msg: "Patient info updated successfully",
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: true, msg: error?.message };
  }
}
export async function createNewPatient(data: any, pid: string) {
  try {
    const validateData = PatientFormSchema.safeParse(data);

    if (!validateData.success) {
      return {
        success: false,
        error: true,
        msg: "Provide all required fields",
      };
    }

    const patientData = validateData.data;
    let patient_id = pid;

    const client = await clerkClient();

    if (pid === "new-patient") {
      const user = await client.users.createUser({
        emailAddress: [patientData.email],
        password: patientData.phone,
        firstName: patientData.first_name,
        lastName: patientData.last_name,
        publicMetadata: { role: "patient" },
      });

      patient_id = user?.id;
    } else {
      await client.users.updateUser(pid, {
        publicMetadata: { role: "patient" },
      });
    }

    const {
      emergency_contact_name,
      emergency_contact_number,
      relation,
      blood_group,
      allergies,
      medical_conditions,
      medical_history,
      insurance_provider,
      insurance_number,
      ...patientDetails
    } = patientData;

    await db.patient.create({
      data: {
        ...patientDetails,
        id: patient_id,
        emergency_contacts: {
          create: [
            {
              name: emergency_contact_name,
              phone: emergency_contact_number,
              relation: relation,
            },
          ],
        },
        medical_records: {
          create: {
            blood_group,
            allergies,
            medical_conditions,
            medical_history,
            insurance_provider,
            insurance_number,
          },
        },
      },
    });

    return { success: true, error: false, msg: "Patient created successfully" };
  } catch (error: any) {
    console.error("Error creating patient:", error);
    return { success: false, error: true, msg: error?.message };
  }
}
