import redisClient from "@/lib/redis";
import db from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { daysOfWeek } from "..";
import { processAppointments } from "./patient";

export async function getDoctors() {
  const cacheKey = "doctors:all";
  const cacheTTL = 60 * 60 * 24; // 24 hours - stable list of doctors

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Serving ${cacheKey} from Redis`);
      return JSON.parse(cachedData);
    }

    const data = await db.doctor.findMany();
    const result = data
      ? { success: true, data, status: 200 }
      : { success: false, message: "No doctors found", status: 404, data: [] };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis`);
    return result;
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return {
      success: false,
      message: error.message || "Internal Server Error",
      status: 500,
      data: [],
    };
  }
}

export async function getDoctorDashboardStats() {
  const { userId } = await auth();
  const cacheKey = `doctor:dashboard:${userId}`;
  const cacheTTL = 60 * 10; // 10 minutes - dynamic appointment data

  try {
    if (!userId) {
      return { success: false, message: "Unauthorized", status: 401 };
    }

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Serving ${cacheKey} from Redis`);
      return JSON.parse(cachedData);
    }

    const todayDate = new Date().getDay();
    const today = daysOfWeek[todayDate];

    const [totalPatient, totalNurses, appointments, doctors] = await Promise.all([
      db.patient.count().catch(() => 0),
      db.staff.count({ where: { role: "NURSE" } }).catch(() => 0),
      db.appointment.findMany({
        where: { doctor_id: userId, appointment_date: { lte: new Date() } },
        include: {
          patient: {
            select: { id: true, first_name: true, last_name: true, gender: true, date_of_birth: true, colorCode: true, img: true },
          },
          doctor: {
            select: { id: true, name: true, specialization: true, img: true, colorCode: true },
          },
        },
        orderBy: { appointment_date: "desc" },
      }).catch(() => []),
      db.doctor.findMany({
        where: { working_days: { some: { day: { equals: today, mode: "insensitive" } } } },
        select: { id: true, name: true, specialization: true, img: true, colorCode: true, working_days: true },
        take: 5,
      }).catch(() => []),
    ]);

    const { appointmentCounts = {}, monthlyData = [] } = appointments.length
      ? await processAppointments(appointments)
      : { appointmentCounts: {}, monthlyData: [] };

    const result = {
      totalNurses: totalNurses || 0,
      totalPatient: totalPatient || 0,
      appointmentCounts,
      last5Records: appointments.slice(0, 5) || [],
      availableDoctors: doctors || [],
      totalAppointment: appointments.length || 0,
      monthlyData,
      success: true,
      status: 200,
    };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis`);
    return result;
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return {
      success: false,
      message: error.message || "Internal Server Error",
      status: 500,
      data: {
        totalNurses: 0,
        totalPatient: 0,
        appointmentCounts: {},
        last5Records: [],
        availableDoctors: [],
        totalAppointment: 0,
        monthlyData: [],
      },
    };
  }
}

export async function getDoctorById(id: string) {
  const cacheKey = `doctor:${id}`;
  const cacheTTL = 60 * 60 * 24; // 24 hours - stable doctor data

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Serving ${cacheKey} from Redis`);
      return JSON.parse(cachedData);
    }

    const [doctor, totalAppointment] = await Promise.all([
      db.doctor.findUnique({
        where: { id },
        include: {
          working_days: true,
          appointments: {
            include: {
              patient: { select: { id: true, first_name: true, last_name: true, gender: true, img: true, colorCode: true } },
              doctor: { select: { name: true, specialization: true, img: true, colorCode: true } },
            },
            orderBy: { appointment_date: "desc" },
            take: 10,
          },
        },
      }),
      db.appointment.count({ where: { doctor_id: id } }),
    ]);

    const result = doctor
      ? { data: doctor, totalAppointment: totalAppointment || 0, success: true, status: 200 }
      : { success: false, message: "Doctor not found", status: 404, data: {} };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis`);
    return result;
  } catch (error) {
    console.error("Error fetching doctor by ID:", error);
    return {
      success: false,
      message: error.message || "Internal Server Error",
      status: 500,
      data: {},
    };
  }
}

export async function getRatingById(id: string) {
  const cacheKey = `doctor:ratings:${id}`;
  const cacheTTL = 60 * 15; // 15 minutes - ratings may change

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Serving ${cacheKey} from Redis`);
      return JSON.parse(cachedData);
    }

    const data = await db.rating.findMany({
      where: { staff_id: id },
      include: { patient: { select: { last_name: true, first_name: true } } },
    });

    const result = data
      ? {
          totalRatings: data.length,
          averageRating: data.length > 0 ? (Math.round((data.reduce((sum, el) => sum + el.rating, 0) / data.length) * 10) / 10).toFixed(1) : "0.0",
          ratings: data,
          success: true,
          status: 200,
        }
      : { success: false, message: "No ratings found", status: 404, data: [] };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis`);
    return result;
  } catch (error) {
    console.error("Error fetching ratings by ID:", error);
    return {
      success: false,
      message: error.message || "Internal Server Error",
      status: 500,
      data: [],
    };
  }
}

export async function getAllDoctors({
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
  const cacheKey = `doctors:all:${PAGE_NUMBER}:${LIMIT}:${search || "no-search"}`;
  const cacheTTL = 60 * 15; // 15 minutes - paginated list with potential updates

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Serving ${cacheKey} from Redis`);
      return JSON.parse(cachedData);
    }

    const SKIP = (PAGE_NUMBER - 1) * LIMIT;
    const totalRecords = await db.doctor.count();
    const doctors = await db.doctor.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { specialization: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
      include: { working_days: true },
      skip: SKIP,
      take: LIMIT,
    });

    const totalPages = Math.ceil(totalRecords / LIMIT);
    const result = {
      success: true,
      data: doctors,
      totalRecords,
      totalPages,
      currentPage: PAGE_NUMBER,
      status: 200,
    };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis`);
    return result;
  } catch (error) {
    console.error("Error in getAllDoctors:", error);
    return {
      success: false,
      message: error.message || "Internal Server Error",
      status: 500,
      data: [],
    };
  }
}