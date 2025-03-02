import Image from "next/image";

export default function Loading() {
  return (
    <div className="flex justify-center items-center h-screen gap-3 bg-slate-950 text-white">
      <Image
        src="/assets/icons/ball-triangle.svg"
        alt="loader"
        width={40}
        height={40}
        className="animate-spin"
      />
      Loading...
    </div>
  );
}
