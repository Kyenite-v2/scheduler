import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-linear-to-br from-green-700 to-green-900 text-white">

      <header className="w-full h-16 px-6 flex items-center justify-between bg-green-800/60 backdrop-blur">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
            />
            <span className="font-semibold tracking-wide text-sm md:text-lg truncate">
              Appointment Scheduler
            </span>
          </div>

          <Button className="bg-white text-black hover:bg-gray-50">
            <Link href={"/login"}>
              Login
            </Link>
          </Button>
        </div>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center text-center px-6">

        <h2 className="text-lg sm:text-xl font-medium text-green-200 mb-2">
          Welcome to Magsaysay College
        </h2>

        <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight">
          Appointment Scheduler
        </h1>

        <p className="max-w-2xl text-sm sm:text-base text-green-100 mb-8 leading-relaxed">
          Easily book your preferred examination or appointment schedule in just a few clicks.
          Our online scheduling system ensures a smooth, organized, and hassle-free experience
          for all students and visitors of Magsaysay College.
        </p>

        <Link
          href="https://www.facebook.com/MagsaysayCollegeOfficial" target="_blank"
          className="px-8 py-3 bg-white text-green-800 font-semibold rounded-full shadow-lg hover:scale-105 transition-all duration-300"
        >
          Find some schedules on our Facebook Page
        </Link>
      </section>

      <footer className="py-6 text-center text-green-200 text-sm border-t border-green-600/30">
        © {new Date().getFullYear()} Kenneth Medel. All rights reserved.
      </footer>
    </main>
  );
}