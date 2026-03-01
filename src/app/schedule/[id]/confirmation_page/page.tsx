import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, CalendarDays, Mail, ArrowLeft, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ConfirmationPage({params}: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
            {/* Header */}
            <header className="w-full h-16 px-4 bg-green-700 text-white flex items-center justify-center">
                <h1 className="text-base sm:text-xl md:text-2xl font-bold text-center leading-tight">
                    <span className="inline-flex items-center gap-2">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={32}
                            height={32}
                            className="inline-block align-middle"
                            priority
                        />
                        Magsaysay College Entrance Exam Scheduler
                    </span>
                </h1>
            </header>

            {/* Content */}
            <main className="px-4 py-10 sm:py-14">
                <div className="mx-auto w-full max-w-xl">
                    <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="text-center space-y-2">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 border border-green-200">
                                <CheckCircle2 className="h-8 w-8 text-green-700" />
                            </div>
                            <CardTitle className="text-2xl sm:text-3xl font-bold">
                                Appointment Scheduled!
                            </CardTitle>
                            <p className="text-sm sm:text-base text-muted-foreground">
                                Your appointment has been successfully submitted. Please check your email for details.
                            </p>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <div className="rounded-xl border bg-white p-4 space-y-3">
                                <div className="flex gap-3">
                                    <CalendarDays className="h-5 w-5 text-green-700 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium">What’s next?</p>
                                        <p className="text-muted-foreground">
                                            Arrive a few minutes early and bring any requirements needed for your exam/appointment.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Mail className="h-5 w-5 text-green-700 mt-0.5" />
                                    <div className="text-sm">
                                        <p className="font-medium">Email confirmation</p>
                                        <p className="text-muted-foreground">
                                            If you don’t see it, check your spam/junk folder.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-xs sm:text-sm text-muted-foreground text-center">
                                If you need help, please contact the admissions office.
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
                            <Button asChild variant="secondary" className="w-full sm:w-auto">
                                <Link href="/" className="inline-flex items-center gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Home
                                </Link>
                            </Button>

                            {/* Optional: go back to schedule page (if you want) */}
                            <Button asChild className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                                <Link href={"/schedule/"+id} className="inline-flex items-center gap-2">
                                    <RotateCcw className="h-4 w-4" />
                                    Book Another
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Tiny footer note */}
                    <div className="mt-6 text-center text-xs text-muted-foreground">
                        © {new Date().getFullYear()} Kenneth Medel
                    </div>
                </div>
            </main>
        </div>
    );
}