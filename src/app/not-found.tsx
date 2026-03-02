import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="w-full h-16 px-4 bg-green-700 text-white flex items-center justify-center">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-center leading-tight flex items-center gap-2">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={30}
                        height={30}
                    />
                    Magsaysay College Appointment Scheduler
                </h1>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="text-6xl font-bold text-green-700 mb-4">
                    404
                </div>

                <h2 className="text-xl font-semibold text-gray-800">
                    Page Not Found
                </h2>

                <p className="mt-2 text-sm text-gray-500 max-w-md">
                    The page you are looking for does not exist or may have been moved.
                </p>

                <Link
                    href="/"
                    className="mt-6 px-6 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 transition"
                >
                    Go Back Home
                </Link>
            </main>
        </div>
    );
}