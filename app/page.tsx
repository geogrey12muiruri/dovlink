import { Button } from "@/components/ui/button";
import { getRole } from "@/utils/roles";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";

export default async function Home() {
  const { userId } = await auth();
  const role = await getRole();

  if (userId && role) {
    redirect(`/${role}`);
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-white overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute w-full h-full bg-gradient-to-br from-blue-50 via-white to-blue-50 animate-gradient-slow"></div>
        <div className="absolute w-72 h-72 bg-blue-200 rounded-full opacity-20 blur-3xl animate-float-slow top-10 left-10"></div>
        <div className="absolute w-96 h-96 bg-blue-100 rounded-full opacity-10 blur-3xl animate-float-slow bottom-20 right-20 delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Hero Image */}
        <div className="relative w-64 h-64 md:w-80 md:h-80">
          <Image
            src="https://res.cloudinary.com/dws2bgxg4/image/upload/v1739707358/logoooo_vvxiak.jpg" // Replace with your Cloudinary vector image URL
            alt="DovLink EHR"
            fill
            className="object-contain"
            priority
          />
        </div>


        {/* Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link href="/sign-up">
            <Button className="bg-pink-500 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
              Get Started
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 hover:text-blue-600 hover:border-blue-600 px-6 py-2 rounded-md"
            >
              Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}