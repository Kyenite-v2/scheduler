"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ScheduleProps = {
    id: string;
    title: string;
    date_start: Date;
    date_end: Date;
    slots: number;
    week: number[];
};

type TimeData = {
    id: number;
    start_time: string;
    end_time: string;
};

type CountRow = {
    time_id: number;
    total: number;
};

type CountsApiResponse = { data: CountRow[] } | { error: string };
type PostApiResponse = { message: string } | { error: string };

function toDateKey(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function isCountsApiResponse(x: unknown): x is CountsApiResponse {
    if (typeof x !== "object" || x === null) return false;
    const obj = x as Record<string, unknown>;
    return "data" in obj || "error" in obj;
}

function isPostApiResponse(x: unknown): x is PostApiResponse {
    if (typeof x !== "object" || x === null) return false;
    const obj = x as Record<string, unknown>;
    return "message" in obj || "error" in obj;
}

function parseDateOnly(yyyyMmDd: string) {
    const [y, m, d] = yyyyMmDd.split("-").map(Number);
    return new Date(y, m - 1, d);
}

export default function Scheduler({
    schedule,
    times = [],
}: {
    schedule?: ScheduleProps;
    times?: TimeData[];
}) {
    const router = useRouter();
    const [invalidEmail, setInvalidEmail] = useState(false);
    const [counts, setCounts] = useState<Record<number, number>>({});
    const [loadingCounts, setLoadingCounts] = useState(false);

    // ✅ prevent double submit
    const [submitting, setSubmitting] = useState(false);

    // optional: control dialog open so we can disable closing while submitting
    const [formOpen, setFormOpen] = useState(false);

    const [formData, setFormData] = useState<{
        date: Date | undefined;
        time: number | null;
        name: string;
        email: string;
        timeText: string;
    }>({
        date: undefined,
        time: null,
        name: "",
        email: "",
        timeText: ""
    });

    const timeCount = times.length;
    const perTimeCap = useMemo(() => {
        if (!schedule?.slots || timeCount === 0) return 0;
        return Math.floor(schedule.slots / timeCount);
    }, [schedule?.slots, timeCount]);

    // ✅ load counts when date changes (show skeleton while loading)
    useEffect(() => {
        if (!schedule?.id || !formData.date) return;

        const dateKey = toDateKey(formData.date);

        const fetchCounts = async () => {
            try {
                setLoadingCounts(true);
                setCounts({}); // clear old counts so skeleton shows cleanly

                const res = await fetch(
                    `/api/schedule?scheduleId=${encodeURIComponent(schedule.id)}&date=${encodeURIComponent(dateKey)}`
                );

                const json: unknown = await res.json();

                if (!isCountsApiResponse(json)) {
                    throw new Error("Unexpected server response.");
                }

                if (!res.ok) {
                    throw new Error("error" in json ? json.error : "Failed to fetch counts");
                }

                const rows = "data" in json ? json.data : [];
                const map: Record<number, number> = {};

                for (const r of rows) {
                    map[r.time_id] = r.total;
                }

                setCounts(map);
            } catch (e) {
                setCounts({});
                toast.error(e instanceof Error ? e.message : "Failed to load slot availability");
            } finally {
                setLoadingCounts(false);
            }
        };

        fetchCounts();
    }, [schedule?.id, formData.date]);

    useEffect(() => {
        if (!loadingCounts) {
            setTimeout(() => {
                document.getElementById("time")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, [loadingCounts])

    const submitHandler = async () => {
        // ✅ lock
        if (submitting) return;

        setInvalidEmail(false);

        if (!schedule?.id) return toast.error("Schedule not found.");
        if (!formData.date || !formData.time) return toast.error("Please select a date and time slot.");
        if (times.length === 0) return toast.error("No time slots available.");

        const timeObj = times.find((t) => t.id === formData.time);
        if (!timeObj) return toast.error("Selected time slot is invalid.");

        if (!formData.name.trim()) return toast.error("Please enter your full name.");

        if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
            setInvalidEmail(true);
            return toast.error("Please enter a valid email address.");
        }

        const taken = counts[formData.time] ?? 0;
        if (perTimeCap > 0 && taken >= perTimeCap) {
            return toast.error("This time slot is already full.");
        }

        const payload = {
            scheduleId: schedule.id,
            date: toDateKey(formData.date),
            timeId: formData.time,
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            timeText: formData.timeText.trim(),
            title: schedule.title
        };

        try {
            setSubmitting(true);

            const res = await fetch("/api/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json: unknown = await res.json();

            if (!isPostApiResponse(json)) {
                toast.error("Unexpected server response.");
                return;
            }

            if (!res.ok) {
                toast.error("error" in json ? json.error : "An error occurred while scheduling your appointment.");
                return;
            }

            toast.success("message" in json ? json.message : "Appointment scheduled successfully!");
            setCounts((prev) => ({
                ...prev,
                [formData.time as number]: (prev[formData.time as number] ?? 0) + 1,
            }));

            setFormOpen(false);
            setFormData((prev) => ({ ...prev, name: "", email: "" }));

            router.push(schedule.id + "/confirmation_page");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Network error");
        } finally {
            setSubmitting(false);
        }
    };

    function selectDateHandler(d: Date | undefined) {
        setFormData((prev) => ({ ...prev, date: d, time: null }));

        if (d) {
            setTimeout(() => {
                document.getElementById("time")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }

    if (!schedule) {
        return (
            <>
                <header>
                    <div className="w-full h-16 px-4 bg-green-700 text-white flex items-center justify-center">
                        <h1 className="text-base sm:text-xl md:text-2xl font-bold text-center leading-tight">
                            <span>
                                <Image
                                    src={"/logo.png"}
                                    alt="Logo"
                                    width={35}
                                    height={35}
                                    className="inline-block mr-2 align-middle"
                                />
                            </span>
                            Magsaysay College Appointment Scheduler
                        </h1>
                    </div>
                </header>

                <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center px-4 py-10">
                    <div className="w-full max-w-xl bg-white border rounded-2xl shadow-sm p-6 sm:p-8 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 border border-green-200 text-green-700 text-2xl font-bold">
                            !
                        </div>
                        <h2 className="text-2xl font-bold">Schedule not found</h2>
                        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                            This schedule may be invalid, expired, or removed.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const dateStart = new Date(schedule.date_start);
    dateStart.setHours(0, 0, 0, 0);

    const minSelectableDate = today >= dateStart ? tomorrow : dateStart;

    return (
        <>
            <header>
                <div className="w-full h-16 px-4 bg-green-700 text-white flex items-center justify-center">
                    <h1 className="text-base sm:text-xl md:text-2xl font-bold text-center leading-tight">
                        <span>
                            <Image
                                src={"/logo.png"}
                                alt="Logo"
                                width={35}
                                height={35}
                                className="inline-block mr-2 align-middle"
                            />
                        </span>
                        Magsaysay College Entrance Exam Scheduler
                    </h1>
                </div>
            </header>

            <div className="bg-green-600 min-h-[calc(100vh-4rem)] flex justify-center items-start sm:items-center px-4 py-6">
                <div className="relative grid grid-cols-1 md:grid-cols-2 items-start md:items-center gap-6 w-full max-w-5xl min-h-[75vh]">
                    <div className="bg-gray-100 shadow p-4 border rounded-2xl h-fit w-full">
                        <div className="text-center text-lg font-bold mb-2">{schedule.title}</div>

                        <Calendar
                            className="w-full h-auto rounded-xl"
                            mode="single"
                            defaultMonth={parseDateOnly(String(schedule.date_start).slice(0, 10) || schedule.date_start.toString())}
                            selected={formData.date}
                            onSelect={selectDateHandler}
                            disabled={[
                                { dayOfWeek: schedule.week },
                                { before: minSelectableDate },
                                { after: schedule.date_end },
                            ]}
                        />
                    </div>

                    {formData.date && (
                        <div
                            id="time"
                            className="border bg-gray-50 flex flex-col p-4 w-full rounded-2xl min-h-105 max-h-[75vh]"
                        >
                            <h1 className="text-xl text-center font-bold mb-2">Select a Time</h1>
                            <p className="text-center text-sm text-muted-foreground mb-4">
                                {loadingCounts
                                    ? "Loading availability..."
                                    : perTimeCap
                                        ? `Up to ${perTimeCap} students per time slot.`
                                        : "Availability not configured."}
                            </p>

                            {times.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground border rounded-xl bg-white p-6">
                                    No time slots available for this schedule.
                                </div>
                            ) : (
                                <div className="flex-1 space-y-4 overflow-auto select-none pr-1">
                                    {/* ✅ skeleton while counts loading */}
                                    {loadingCounts ? (
                                        <>
                                            {Array.from({ length: Math.min(times.length, 6) }).map((_, i) => (
                                                <div key={i} className="rounded-2xl border bg-white p-4 space-y-2">
                                                    <Skeleton className="h-5 w-44" />
                                                    <Skeleton className="h-4 w-28" />
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            {times.map((time) => {
                                                const taken = counts[time.id] ?? 0;
                                                const isFull = perTimeCap ? taken >= perTimeCap : false;
                                                const remaining = perTimeCap ? Math.max(perTimeCap - taken, 0) : null;

                                                const isSelectable = !isFull; // only if not full
                                                const isSelected = time.id === formData.time;

                                                return (
                                                    <div
                                                        key={time.id}
                                                        className={[
                                                            "py-4 rounded-2xl border text-center font-medium transition",
                                                            isSelectable
                                                                ? isSelected
                                                                    ? "bg-green-100 text-green-600 border-green-600 cursor-pointer"
                                                                    : "bg-gray-200 text-gray-900 cursor-pointer"
                                                                : "bg-zinc-100 text-zinc-400 cursor-not-allowed",
                                                        ].join(" ")}
                                                        onClick={() => {
                                                            if (!isSelectable) return;
                                                            if (loadingCounts) return;
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                time: prev.time === time.id ? null : time.id,
                                                                timeText: prev.time === time.id ? "" : `${time.start_time.slice(0, 5)} - ${time.end_time.slice(0, 5)}`
                                                            }));
                                                        }}
                                                    >
                                                        {time.start_time.slice(0, 5)} - {time.end_time.slice(0, 5)}
                                                        {perTimeCap ? (
                                                            <div className="mt-1 text-xs font-normal">
                                                                {isFull ? "Full" : `${remaining} slot(s) left`}
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                                </div>
                            )}

                            <div className="pt-4">
                                <Dialog
                                    open={formOpen}
                                    onOpenChange={(v) => {
                                        // ✅ prevent closing while submitting
                                        if (submitting) return;
                                        setFormOpen(v);
                                    }}
                                >
                                    <DialogTrigger asChild>
                                        <Button
                                            className="w-full"
                                            disabled={!formData.time || times.length === 0 || loadingCounts || submitting}
                                        >
                                            Proceed
                                        </Button>
                                    </DialogTrigger>

                                    <DialogContent className="max-h-[85vh] overflow-auto">
                                        <DialogHeader>
                                            <DialogTitle className="text-center">Please Fill Up the Form</DialogTitle>
                                            <DialogDescription className="text-center">
                                                Provide us your full name and contact email.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Full Name</Label>
                                                <Input
                                                    id="name"
                                                    placeholder="John Doe Y. Dela Cruz"
                                                    value={formData.name}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                                    }
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">Contact Email</Label>
                                                <Input
                                                    id="email"
                                                    placeholder="john@example.com"
                                                    value={formData.email}
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                                                    }
                                                    aria-invalid={invalidEmail}
                                                    disabled={submitting}
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                className="w-full"
                                                onClick={submitHandler}
                                                disabled={submitting}
                                            >
                                                {submitting ? "Submitting..." : "Submit"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <footer className="py-6 text-center text-gray-400 text-sm border-t border-gray-600/30">
                © {new Date().getFullYear()} Kenneth Medel. All rights reserved.
            </footer>
        </>
    );
}