import { getDoctorDashboardStats } from "@/utils/services/doctor";
import { auth } from "@clerk/nextjs/server";

export async function GET(req) {
  const { userId } = await auth();

  if (!userId) {
    return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const stats = await getDoctorDashboardStats();
    return new Response(JSON.stringify({ success: true, data: stats }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "http://localhost:8081", // Expo web URL
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(req) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:8081",
      "Access-Control-Allow-Methods": "GET",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
