import Image from "next/image";

export default function Loading() {
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
                    Magsaysay College Entrance Exam Scheduler
                </h1>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
                <div className="h-10 w-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin mb-6" />

                <h2 className="text-xl font-semibold text-gray-800">
                    Loading...
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                    Please wait while the page loads.
                </p>
            </main>
        </div>
    );
}