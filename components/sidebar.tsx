import { getRole } from "@/utils/roles";
import {
  Bell,
  LayoutDashboard,
  List,
  ListOrdered,
  Logs,
  LucideIcon,
  Pill,
  Receipt,
  Settings,
  SquareActivity,
  User,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import { LogoutButton } from "./logout-button";
import Image from "next/image";

const ACCESS_LEVELS_ALL = [
  "admin",
  "doctor",
  "nurse",
  "lab technician",
  "patient",
];

const SidebarIcon = ({ icon: Icon }: { icon: LucideIcon }) => {
  return <Icon className="size-6 lg:size-5 transition-all duration-200" />;
};

export const Sidebar = async () => {
  const role = await getRole();

  const SIDEBAR_LINKS = [
    {
      label: "MENU",
      links: [
        {
          name: "Dashboard",
          href: "/",
          access: ACCESS_LEVELS_ALL,
          icon: LayoutDashboard,
        },
        {
          name: "Profile",
          href: "/patient/self",
          access: ["patient"],
          icon: User,
        },
      ],
    },
    {
      label: "Manage",
      links: [
        {
          name: "Users",
          href: "/record/users",
          access: ["admin"],
          icon: Users,
        },
        {
          name: "Doctors",
          href: "/record/doctors",
          access: ["admin"],
          icon: User,
        },
        {
          name: "Staffs",
          href: "/record/staffs",
          access: ["admin", "doctor"],
          icon: UserRound,
        },
        {
          name: "Patients",
          href: "/record/patients",
          access: ["admin", "doctor", "nurse"],
          icon: UsersRound,
        },
        {
          name: "Appointments",
          href: "/record/appointments",
          access: ["admin", "doctor", "nurse"],
          icon: ListOrdered,
        },
        {
          name: "Medical Records",
          href: "/record/medical-records",
          access: ["admin", "doctor", "nurse"],
          icon: SquareActivity,
        },
        {
          name: "Billing Overview",
          href: "/record/billing",
          access: ["admin", "doctor"],
          icon: Receipt,
        },
        {
          name: "Patient Management",
          href: "/nurse/patient-management",
          access: ["nurse"],
          icon: Users,
        },
        {
          name: "Administer Medications",
          href: "/nurse/administer-medications",
          access: ["admin", "doctor", "nurse"],
          icon: Pill,
        },
        {
          name: "Appointments",
          href: "/record/appointments",
          access: ["patient"],
          icon: ListOrdered,
        },
        {
          name: "Records",
          href: "/patient/self",
          access: ["patient"],
          icon: List,
        },
        {
          name: "Prescription",
          href: "#",
          access: ["patient"],
          icon: Pill,
        },
        {
          name: "Billing",
          href: "/patient/self?cat=payments",
          access: ["patient"],
          icon: Receipt,
        },
      ],
    },
    {
      label: "System",
      links: [
        {
          name: "Notifications",
          href: "/notifications",
          access: ACCESS_LEVELS_ALL,
          icon: Bell,
        },
        {
          name: "Audit Logs",
          href: "/admin/audit-logs",
          access: ["admin"],
          icon: Logs,
        },
        {
          name: "Settings",
          href: "/admin/system-settings",
          access: ["admin"],
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <div className="w-16 lg:w-64 h-screen p-4 flex flex-col justify-between gap-6 bg-green-200 shadow-lg transition-all duration-300">
      {/* Header Section */}
      <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-1 rounded-lg bg-white shadow-md transition-transform hover:scale-105">
            <Image
              src="https://res.cloudinary.com/dws2bgxg4/image/upload/v1739707358/logoooo_vvxiak.jpg"
              alt="DovLink"
              width={40}
              height={40}
              className="rounded-md"
            />
          </div>
          <span className="hidden lg:block text-xl font-semibold text-gray-800 tracking-tight">
            DovLink
          </span>
        </Link>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {SIDEBAR_LINKS.map((section) => (
          <div key={section.label} className="mb-6">
            <span className="hidden lg:block px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {section.label}
            </span>
            <div className="mt-2 space-y-1">
              {section.links.map((link) => {
                if (link.access.includes(role.toLowerCase())) {
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 text-gray-600 rounded-lg transition-all duration-200 hover:bg-blue-100 hover:text-blue-700 group"
                    >
                      <SidebarIcon icon={link.icon} />
                      <span className="hidden lg:block text-sm font-medium group-hover:font-semibold">
                        {link.name}
                      </span>
                    </Link>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout Section */}
      <div className="mt-auto">
        <LogoutButton />
      </div>
    </div>
  );
};
