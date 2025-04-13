import { Roles } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";

export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth();

  return sessionClaims?.metadata?.role === role.toLowerCase();
};

export const getRole = async () => {
  const { sessionClaims } = await auth();

  console.log("Session Claims:", sessionClaims);

  const role = sessionClaims?.metadata?.role?.toLowerCase() || "doctor";

  console.log("Resolved Role:", role);

  return role;
};