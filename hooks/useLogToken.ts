"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

const useLogToken = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    const logToken = async () => {
      try {
        const token = await getToken();
        console.log("Token:", token);
        // You can now use the token for authenticated requests
      } catch (error) {
        console.error("Error getting token:", error);
      }
    };

    logToken();
  }, [getToken]);
};

export default useLogToken;
