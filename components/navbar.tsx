"use client";

import { useAuth, UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";

export const Navbar = () => {
  const { userId } = useAuth();

  function formatPathName(): string {
    const pathname = usePathname();
    if (!pathname) return "Overview";

    const splitRoute = pathname.split("/");
    const lastIndex = splitRoute.length - 1 > 2 ? 2 : splitRoute.length - 1;
    const pathName = splitRoute[lastIndex];
    const formattedPath = pathName.replace(/-/g, " ");

    return formattedPath.charAt(0).toUpperCase() + formattedPath.slice(1);
  }

  const path = formatPathName();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 p-5 flex justify-between items-center">
      {/* Left: Page Title */}
      <h1 className="text-2xl font-semibold text-gray-800 capitalize tracking-tight">
        {path || "Overview"}
      </h1>

      {/* Right: Actions */}
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <div className="relative group">
          <button className="p-2 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center shadow-sm">
              2
            </span>
          </button>
        </div>

        {/* User Profile */}
        {userId && (
          <div className="flex items-center gap-2">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 ring-2 ring-gray-200 hover:ring-gray-300 transition-all",
                  userButtonTrigger: "focus:outline-none",
                },
              }}
            />
          </div>
        )}
      </div>
    </nav>
  );
};