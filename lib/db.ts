import { PrismaClient } from "@prisma/client";
import {
  invalidatePatientCaches,
  invalidateAppointmentCaches,
  invalidateDoctorCaches,
  invalidateDoctorDashboardCaches,
} from "./cache";

const prismaClientSingleton = () => {
  const prisma = new PrismaClient();

  // Middleware for automatic cache invalidation
  prisma.$use(async (params, next) => {
    const result = await next(params);

    // Patient updates or deletes
    if (params.model === "Patient" && (params.action === "update" || params.action === "delete")) {
      const patientId = params.args.where?.id;
      if (patientId) {
        await invalidatePatientCaches(patientId);
      }
    }

    // Appointment creates, updates, or deletes
    if (params.model === "Appointment" && (params.action === "update" || params.action === "create" || params.action === "delete")) {
      const patientId = params.args.data?.patient_id || params.args.where?.patient_id;
      const doctorId = params.args.data?.doctor_id || params.args.where?.doctor_id;
      if (patientId) {
        await invalidateAppointmentCaches(patientId);
      }
      if (doctorId) {
        await invalidateDoctorDashboardCaches(doctorId); // Affects doctor dashboard
      }
    }

    // Doctor updates or deletes
    if (params.model === "Doctor" && (params.action === "update" || params.action === "delete")) {
      const doctorId = params.args.where?.id;
      if (doctorId) {
        await invalidateDoctorCaches(doctorId);
      }
    }

    // Rating creates, updates, or deletes (assuming ratings are tied to doctors via staff_id)
    if (params.model === "Rating" && (params.action === "create" || params.action === "update" || params.action === "delete")) {
      const doctorId = params.args.data?.staff_id || params.args.where?.staff_id;
      if (doctorId) {
        await invalidateDoctorCaches(doctorId); // Affects doctor ratings
      }
    }

    return result;
  });

  return prisma;
};

// Singleton pattern
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = db;