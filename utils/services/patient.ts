import redisClient from "@/lib/redis";
import db from "@/lib/db";
import { getMonth, format, startOfYear, endOfMonth } from "date-fns";
import { daysOfWeek } from "..";

type AppointmentStatus = "PENDING" | "SCHEDULED" | "COMPLETED" | "CANCELLED";

interface Appointment {
  status: AppointmentStatus;
  appointment_date: Date;
}

function isValidStatus(status: string): status is AppointmentStatus {
  return ["PENDING", "SCHEDULED", "COMPLETED", "CANCELLED"].includes(status);
}

const initializeMonthlyData = () => {
  const this_year = new Date().getFullYear();
  const months = Array.from({ length: getMonth(new Date()) + 1 }, (_, index) => ({
    name: format(new Date(this_year, index), "MMM"),
    appointment: 0,
    completed: 0,
  }));
  return months;
};

export const processAppointments = async (appointments: Appointment[]) => {
  const monthlyData = initializeMonthlyData();
  const appointmentCounts = appointments.reduce<Record<AppointmentStatus, number>>(
    (acc, appointment) => {
      const status = appointment.status;
      const appointmentDate = appointment.appointment_date;
      const monthIndex = getMonth(appointmentDate);

      if (appointmentDate >= startOfYear(new Date()) && appointmentDate <= endOfMonth(new Date())) {
        monthlyData[monthIndex].appointment += 1;
        if (status === "COMPLETED") monthlyData[monthIndex].completed += 1;
      }

      if (isValidStatus(status)) acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { PENDING: 0, SCHEDULED: 0, COMPLETED: 0, CANCELLED: 0 }
  );

  return { appointmentCounts, monthlyData };
};

export async function getPatientDashboardStatistics(id: string) {
  const cacheKey = `patient:dashboard:${id}`;
  const cacheTTL = 60 * 10; // 10 minutes

  try {
    if (!id) return { success: false, message: "No data found", data: null };

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Serving ${cacheKey} from Redis`);
      return JSON.parse(cachedData);
    }

    const data = await db.patient.findUnique({
      where: { id },
      select: { id: true, first_name: true, last_name: true, gender: true, img: true, colorCode: true },
    });

    if (!data) return { success: false, message: "Patient data not found", status: 200, data: null };

    const appointments = await db.appointment.findMany({
      where: { patient_id: data.id },
      include: {
        doctor: { select: { id: true, name: true, img: true, specialization: true, colorCode: true } },
        patient: { select: { first_name: true, last_name: true, gender: true, date_of_birth: true, img: true, colorCode: true } },
      },
      orderBy: { appointment_date: "desc" },
    });

    if (!appointments.length) {
      const result = {
        success: true,
        data,
        appointmentCounts: { PENDING: 0, SCHEDULED: 0, COMPLETED: 0, CANCELLED: 0 },
        last5Records: [],
        totalAppointments: 0,
        availableDoctor: [],
        monthlyData: initializeMonthlyData(),
        status: 200,
      };
      await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
      console.log(`Cached ${cacheKey} in Redis`);
      return result;
    }

    const { appointmentCounts, monthlyData } = await processAppointments(appointments);
    const last5Records = appointments.slice(0, 5);
    const today = daysOfWeek[new Date().getDay()];
    const availableDoctor = await db.doctor.findMany({
      select: { id: true, name: true, specialization: true, img: true, working_days: true, colorCode: true },
      where: { working_days: { some: { day: { equals: today, mode: "insensitive" } } } },
      take: 4,
    });

    const result = {
      success: true,
      data,
      appointmentCounts,
      last5Records,
      totalAppointments: appointments.length,
      availableDoctor,
      monthlyData,
      status: 200,
    };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis`);
    return result;
  } catch (error) {
    console.error("getPatientDashboardStatistics - Error:", error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getPatientById(id: string) {
  const cacheKey = `patient:${id}`;
  const cacheTTL = 60 * 60 * 24; // 24 hours

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      console.log(`Serving ${cacheKey} from Redis, parsed data:`, parsedData);
      return parsedData;
    }

    const patient = await db.patient.findUnique({ where: { id } });
    console.log(`getPatientById - DB query result for id ${id}:`, patient);
    const result = patient
      ? { success: true, data: patient, status: 200 }
      : { success: false, message: "Patient data not found", status: 200, data: null };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis, result:`, result);
    return result;
  } catch (error) {
    console.error("getPatientById - Error:", error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getPatientFullDataById(id: string) {
  const cacheKey = `patient:full:${id}`;
  const cacheTTL = 60 * 15; // 15 minutes

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Serving ${cacheKey} from Redis`);
      return JSON.parse(cachedData);
    }

    const patient = await db.patient.findFirst({
      where: { OR: [{ id }, { email: id }] },
      include: {
        _count: { select: { appointments: true } },
        appointments: {
          select: { appointment_date: true },
          orderBy: { appointment_date: "desc" },
          take: 1,
        },
      },
    });
    console.log(`getPatientFullDataById - DB query result for id ${id}:`, patient);

    if (!patient) {
      const result = { success: false, message: "Patient data not found", status: 404 };
      await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
      return result;
    }

    const lastVisit = patient.appointments[0]?.appointment_date || null;
    const result = {
      success: true,
      data: { ...patient, totalAppointments: patient._count.appointments, lastVisit },
      status: 200,
    };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis, result:`, result);
    return result;
  } catch (error) {
    console.error("getPatientFullDataById - Error:", error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getAllPatients({
  page,
  limit,
  search,
}: {
  page: number | string;
  limit?: number | string;
  search?: string;
}) {
  const PAGE_NUMBER = Number(page) <= 0 ? 1 : Number(page);
  const LIMIT = Number(limit) || 10;
  const cacheKey = `patients:all:${PAGE_NUMBER}:${LIMIT}:${search || "no-search"}`;
  const cacheTTL = 60 * 15; // 15 minutes

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Serving ${cacheKey} from Redis`);
      return JSON.parse(cachedData);
    }

    const SKIP = (PAGE_NUMBER - 1) * LIMIT;
    const [patients, totalRecords] = await Promise.all([
      db.patient.findMany({
        where: {
          OR: [
            { first_name: { contains: search, mode: "insensitive" } },
            { last_name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
        include: {
          appointments: {
            select: {
              medical: {
                select: { created_at: true, treatment_plan: true },
                orderBy: { created_at: "desc" },
                take: 1,
              },
            },
            orderBy: { appointment_date: "desc" },
            take: 1,
          },
        },
        skip: SKIP,
        take: LIMIT,
        orderBy: { first_name: "asc" },
      }),
      db.patient.count(),
    ]);
    console.log(`getAllPatients - DB query result:`, { patients, totalRecords });

    if (!patients) {
      return { success: false, message: "No patients found", status: 404 };
    }

    const totalPages = Math.ceil(totalRecords / LIMIT);
    const result = {
      success: true,
      data: patients,
      totalRecords,
      totalPages,
      currentPage: PAGE_NUMBER,
      status: 200,
    };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis, result:`, result);
    return result;
  } catch (error) {
    console.error("getAllPatients - Error:", error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}