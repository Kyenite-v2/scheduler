import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col">
            <header>
                <div className="w-full h-16 px-4 bg-green-700 text-white flex items-center justify-center">
                    <h1 className="text-base sm:text-xl md:text-2xl font-bold text-center leading-tight">
                        <span>
                            <Image src={"/logo.png"} alt="Logo" width={35} height={35} className="inline-block mr-2 align-middle" />
                        </span>
                        Magsaysay College Entrance Exam Scheduler
                    </h1>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-xl bg-white border rounded-2xl shadow-sm p-6 sm:p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 border border-green-200 text-green-700 text-2xl font-bold">
                        !
                    </div>

                    <h2 className="text-2xl font-bold">Schedule not found</h2>
                    <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                        The schedule link may be invalid, expired, or removed. Please check the URL and try again.
                    </p>

                    <div className="mt-6 space-y-3">
                        <Button asChild className="w-full">
                            <Link href="/">Go back to Home</Link>
                        </Button>
                        {/* <Button asChild variant="secondary" className="w-full">
                            <Link href="/schedule">View available schedules</Link>
                        </Button> */}
                    </div>

                    <div className="mt-6 rounded-xl border bg-gray-50 p-4 text-left">
                        <div className="text-sm font-semibold">Tips</div>
                        <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground space-y-1">
                            <li>Make sure the schedule ID in the URL is correct.</li>
                            <li>If you got this link from someone, ask them to resend it.</li>
                            <li>If you&apos;re the admin, confirm the schedule exists in the database.</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}