import redisClient from "@/lib/redis";

export async function invalidatePatientCaches(patientId: string) {
  const keys = [`patient:${patientId}`, `patient:full:${patientId}`, `patient:dashboard:${patientId}`];
  await Promise.all(keys.map((key) => redisClient.del(key)));
  console.log(`Invalidated patient-specific caches for ${patientId}`);
  await invalidateMedicalCachesForPatient(patientId);
  await invalidateAppointmentCachesForPatient(patientId);
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
}

export async function invalidateDoctorDashboardCaches(doctorId: string) {
  const keys = [`doctor:dashboard:${doctorId}`];
  await Promise.all(keys.map((key) => redisClient.del(key)));
  console.log(`Invalidated dashboard caches for doctor ${doctorId}`);
}

export async function invalidateMedicalCachesForPatient(patientId: string) {
  const medicalKeys = await redisClient.keys(`medical:all:*:*:${patientId}`);
  if (medicalKeys.length) {
    await redisClient.del(medicalKeys);
    console.log(`Invalidated medical record caches for patient ${patientId}`);
  }
}

export async function invalidateAppointmentCachesForPatient(patientId: string) {
  const appointmentKeys = await redisClient.keys(`appointments:all:*:*:*:${patientId}`);
  if (appointmentKeys.length) {
    await redisClient.del(appointmentKeys);
    console.log(`Invalidated appointment list caches for patient ${patientId}`);
  }
}

export async function invalidateAppointmentCachesForDoctor(doctorId: string) {
  const appointmentKeys = await redisClient.keys(`appointments:all:*:*:*:${doctorId}`);
  if (appointmentKeys.length) {
    await redisClient.del(appointmentKeys);
    console.log(`Invalidated appointment list caches for doctor ${doctorId}`);
  }
}

export async function invalidateSpecificAppointment(appointmentId: number) {
  const keys = [`appointment:${appointmentId}`, `appointment:medical:${appointmentId}`];
  await Promise.all(keys.map((key) => redisClient.del(key)));
  console.log(`Invalidated specific appointment caches for ${appointmentId}`);
}