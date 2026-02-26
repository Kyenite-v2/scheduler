"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

type ScheduleProps = {
    id: string;
    title: string;
    slots: number;
    week: number[]; // values 0-6
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

type CountsApiResponse =
    | { data: CountRow[] }
    | { error: string };

type PostApiResponse =
    | { message: string }
    | { error: string };

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

export default function Scheduler({
    schedule,
    times = [],
}: {
    schedule?: ScheduleProps;
    times?: TimeData[];
}) {
    const [invalidEmail, setInvalidEmail] = useState(false);
    const [counts, setCounts] = useState<Record<number, number>>({});
    const [loadingCounts, setLoadingCounts] = useState(false);

    const [formData, setFormData] = useState<{
        date: Date | undefined;
        time: number | null;
        name: string;
        email: string;
    }>({
        date: undefined,
        time: null,
        name: "",
        email: "",
    });

    const timeCount = times.length;
    const perTimeCap = useMemo(() => {
        if (!schedule?.slots || timeCount === 0) return 0;
        return Math.floor(schedule.slots / timeCount);
    }, [schedule?.slots, timeCount]);

    useEffect(() => {
        if (!schedule?.id || !formData.date) return;

        const controller = new AbortController();
        const dateKey = toDateKey(formData.date);

        (async () => {
            try {
                setLoadingCounts(true);

                const res = await fetch(
                    `/api/schedule?scheduleId=${encodeURIComponent(schedule.id)}&date=${encodeURIComponent(dateKey)}`,
                    { signal: controller.signal }
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
                // ignore abort
                if (e instanceof DOMException && e.name === "AbortError") return;

                setCounts({});
                const msg = e instanceof Error ? e.message : "Failed to load slot availability";
                toast.error(msg);
            } finally {
                setLoadingCounts(false);
            }
        })();

        return () => controller.abort();
    }, [schedule?.id, formData.date]);

    const submitHandler = async () => {
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
        };

        try {
            const res = await fetch("/api/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json: unknown = await res.json();

            if (!isPostApiResponse(json)) {
                return toast.error("Unexpected server response.");
            }

            if (!res.ok) {
                return toast.error("error" in json ? json.error : "An error occurred while scheduling your appointment.");
            }

            toast.success("message" in json ? json.message : "Appointment scheduled successfully!");
            setCounts((prev) => ({
                ...prev,
                [formData.time as number]: (prev[formData.time as number] ?? 0) + 1,
            }));
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Network error";
            toast.error(msg);
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
                            Magsaysay College Entrance Exam Scheduler
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

    // IMPORTANT:
    // Your current Calendar disabled={[{ dayOfWeek: schedule.week }]} DISABLES those days.
    // If schedule.week contains DISABLED DAYS (e.g. [0,6]) keep it.
    // If schedule.week contains ALLOWED DAYS (e.g. [1,2,3,4,5]) then invert the logic.
    const disabledDays = schedule.week ?? [];

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

            <div className="min-h-[calc(100vh-4rem)] flex justify-center items-start sm:items-center px-4 py-6">
                <div className="relative grid grid-cols-1 md:grid-cols-2 items-start md:items-center gap-6 w-full max-w-5xl min-h-[75vh]">
                    <div className="shadow p-4 border rounded-2xl h-fit w-full bg-white">
                        <div className="text-center text-lg font-bold">{schedule.title}</div>

                        <Calendar
                            className="w-full h-auto"
                            mode="single"
                            selected={formData.date}
                            onSelect={selectDateHandler}
                            disabled={[{ dayOfWeek: disabledDays }]}
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
                                    {times.map((time) => {
                                        const taken = counts[time.id] ?? 0;
                                        const isFull = perTimeCap ? taken >= perTimeCap : false;
                                        const remaining = perTimeCap ? Math.max(perTimeCap - taken, 0) : null;

                                        // ✅ No "available" column in DB, so selectable = not full
                                        const isSelectable = !isFull;

                                        const isSelected = time.id === formData.time;

                                        return (
                                            <div
                                                key={time.id}
                                                className={[
                                                    "py-4 rounded-2xl border text-center font-medium",
                                                    isSelectable
                                                        ? isSelected
                                                            ? "bg-green-100 text-green-600 border-green-600 cursor-pointer"
                                                            : "bg-gray-200 text-gray-900 cursor-pointer"
                                                        : "bg-zinc-100 text-zinc-400 cursor-not-allowed",
                                                ].join(" ")}
                                                onClick={() => {
                                                    if (!isSelectable) return;
                                                    setFormData((prev) => ({ ...prev, time: prev.time === time.id ? null : time.id }));
                                                }}
                                            >
                                                {time.start_time} - {time.end_time}
                                                {perTimeCap ? (
                                                    <div className="mt-1 text-xs font-normal">
                                                        {isFull ? "Full" : `${remaining} slot(s) left`}
                                                    </div>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="pt-4">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="w-full" disabled={!formData.time || times.length === 0}>
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
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="email">Contact Email</Label>
                                                <Input
                                                    id="email"
                                                    placeholder="john@example.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                                                    aria-invalid={invalidEmail}
                                                />
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button className="w-full" onClick={submitHandler}>
                                                Submit
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}