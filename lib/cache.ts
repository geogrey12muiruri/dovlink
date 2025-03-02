import redisClient from "@/lib/redis";

export async function invalidatePatientCaches(patientId: string) {
  const keys = [`patient:${patientId}`, `patient:full:${patientId}`, `patient:dashboard:${patientId}`];
  await Promise.all(keys.map((key) => redisClient.del(key)));
  console.log(`Invalidated patient-specific caches for ${patientId}`);

  const allPatientKeys = await redisClient.keys("patients:all:*");
  if (allPatientKeys.length) {
    await redisClient.del(allPatientKeys);
    console.log(`Invalidated all patient list caches`);
  }
}

export async function invalidateAppointmentCaches(patientId: string) {
  const keys = [`patient:dashboard:${patientId}`, `patient:full:${patientId}`];
  await Promise.all(keys.map((key) => redisClient.del(key)));
  console.log(`Invalidated appointment-related caches for patient ${patientId}`);
}

export async function invalidateDoctorCaches(doctorId: string) {
  const keys = [`doctor:${doctorId}`, `doctor:dashboard:${doctorId}`, `doctor:ratings:${doctorId}`];
  await Promise.all(keys.map((key) => redisClient.del(key)));
  console.log(`Invalidated doctor-specific caches for ${doctorId}`);

  const allDoctorKeys = await redisClient.keys("doctors:all:*");
  if (allDoctorKeys.length) {
    await redisClient.del(allDoctorKeys);
    console.log(`Invalidated all doctor list caches`);
  }
}

export async function invalidateDoctorDashboardCaches(doctorId: string) {
  const keys = [`doctor:dashboard:${doctorId}`];
  await Promise.all(keys.map((key) => redisClient.del(key)));
  console.log(`Invalidated dashboard caches for doctor ${doctorId}`);
}