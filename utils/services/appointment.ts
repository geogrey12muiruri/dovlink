import redisClient from "@/lib/redis";
import db, { prisma } from "@/lib/db"; // Ensure prisma is imported from db
import { Prisma } from "@prisma/client";

export async function getAppointmentById(id: number) {
  const cacheKey = `appointment:${id}`;
  const cacheTTL = 60 * 15; // 15 minutes - moderate volatility

  try {
    if (!id) {
      return { success: false, message: "Appointment id does not exist.", status: 404 };
    }

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Serving ${cacheKey} from Redis`);
      return JSON.parse(cachedData);
    }

    const data = await db.appointment.findUnique({
      where: { id },
      include: {
        doctor: { select: { id: true, name: true, specialization: true, img: true } },
        patient: {
          select: { id: true, first_name: true, last_name: true, date_of_birth: true, gender: true, img: true, address: true, phone: true },
        },
      },
    });

    const result = data
      ? { success: true, data, status: 200 }
      : { success: false, message: "Appointment data not found", status: 200, data: null };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis`);
    return result;
  } catch (error) {
    console.error("Error fetching appointment by ID:", error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

interface AllAppointmentsProps {
  page: number | string;
  limit?: number | string;
  search?: string;
  id?: string;
}

const buildQuery = (id?: string, search?: string) => {
  const searchConditions: Prisma.AppointmentWhereInput = search
    ? {
        OR: [
          { patient: { first_name: { contains: search, mode: "insensitive" } } },
          { patient: { last_name: { contains: search, mode: "insensitive" } } },
          { doctor: { name: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {};

  const idConditions: Prisma.AppointmentWhereInput = id
    ? { OR: [{ patient_id: id }, { doctor_id: id }] }
    : {};

  const combinedQuery: Prisma.AppointmentWhereInput =
    id || search
      ? {
          AND: [
            ...(Object.keys(searchConditions).length > 0 ? [searchConditions] : []),
            ...(Object.keys(idConditions).length > 0 ? [idConditions] : []),
          ],
        }
      : {};

  return combinedQuery;
};
export async function getPatientAppointments({
  page,
  limit,
  search,
  id,
}: AllAppointmentsProps) {
  const PAGE_NUMBER = Number(page) <= 0 ? 1 : Number(page);
  const LIMIT = Number(limit) || 10;
  const cacheKey = `appointments:all:${PAGE_NUMBER}:${LIMIT}:${search || "no-search"}:${id || "no-id"}`;
  const cacheTTL = 60 * 10; // 10 minutes - dynamic list

  try {
    // Check Redis cache first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Serving ${cacheKey} from Redis`);
      return JSON.parse(cachedData);
    }

    // Fetch from DB
    const SKIP = (PAGE_NUMBER - 1) * LIMIT;
    let data, totalRecord;
    try {
      [data, totalRecord] = await Promise.all([
        db.appointment.findMany({
          where: buildQuery(id, search),
          skip: SKIP,
          take: LIMIT,
          select: {
            id: true,
            patient_id: true,
            doctor_id: true,
            type: true,
            appointment_date: true,
            time: true,
            status: true,
            patient: {
              select: { id: true, first_name: true, last_name: true, phone: true, gender: true, img: true, date_of_birth: true, colorCode: true },
            },
            doctor: {
              select: { id: true, name: true, specialization: true, colorCode: true, img: true },
            },
          },
          orderBy: { appointment_date: "desc" },
        }),
        db.appointment.count({ where: buildQuery(id, search) }),
      ]);
    } catch (dbError) {
      console.error("Database fetch failed:", dbError);
      // Fallback to Redis if available, even if stale
      const fallbackData = await redisClient.get(cacheKey);
      if (fallbackData) {
        console.log(`Serving stale ${cacheKey} from Redis due to DB failure`);
        return JSON.parse(fallbackData);
      }
      throw dbError; // If no cache, propagate error
    }

    const result = data
      ? {
          success: true,
          data,
          totalPages: Math.ceil(totalRecord / LIMIT),
          currentPage: PAGE_NUMBER,
          totalRecord,
          status: 200,
        }
      : { success: false, message: "Appointment data not found", status: 200, data: null };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis`);
    return result;
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}

export async function getAppointmentWithMedicalRecordsById(id: number) {
  const cacheKey = `appointment:medical:${id}`;
  const cacheTTL = 60 * 10; // 10 minutes - detailed but less frequent

  try {
    if (!id) {
      return { success: false, message: "Appointment id does not exist.", status: 404 };
    }

    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`Serving ${cacheKey} from Redis`);
      return JSON.parse(cachedData);
    }

    const data = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        bills: true,
        medical: {
          include: {
            diagnosis: true,
            vital_signs: true,
            orders: true,
          },
        },
      },
    });

    console.log("Fetched appointment data:", data);

    const result = data
      ? data.patient && data.doctor && data.medical
        ? { success: true, data, status: 200 }
        : { success: false, message: "Incomplete appointment data", status: 200 }
      : { success: false, message: "Appointment data not found", status: 200 };

    await redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(result));
    console.log(`Cached ${cacheKey} in Redis`);
    return result;
  } catch (error) {
    console.error("Error fetching appointment with medical records by ID:", error);
    return { success: false, message: "Internal Server Error", status: 500 };
  }
}