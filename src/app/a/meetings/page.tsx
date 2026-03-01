"use client";

import NewSidebar from "@/app/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ScheduleOption = {
    id: string;
    title: string;
    date_start: string; // YYYY-MM-DD
    date_end: string;   // YYYY-MM-DD
    enabled: boolean;
};

type AppointmentRow = {
    id: number;
    name: string;
    email: string;
    created_at: string;
};

type TimeBucket = {
    time_id: number;
    start_time: string; // "HH:mm:ss"
    end_time: string;   // "HH:mm:ss"
    appointments: AppointmentRow[];
};

type DayGroup = {
    date: string; // YYYY-MM-DD
    times: TimeBucket[];
};

type MeetingsApiOk = { schedules: ScheduleOption[]; groups: DayGroup[] };
type MeetingsApiErr = { error: string };
type MeetingsApiResponse = MeetingsApiOk | MeetingsApiErr;

function isApiResponse(x: unknown): x is MeetingsApiResponse {
    return typeof x === "object" && x !== null && ("error" in x || ("schedules" in x && "groups" in x));
}

// local-safe (no timezone shifting)
function ymdToDate(ymd: string) {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
}
function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function formatHeading(dateYmd: string) {
    const d = ymdToDate(dateYmd);
    const now = new Date();

    const base = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(d);

    if (isSameDay(d, now)) return `Today, ${base}`;

    const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(d);
    return `${weekday}, ${base}`;
}

function formatTime(t: string) {
    // accepts "HH:mm:ss" or "HH:mm"
    const [hh, mm] = t.split(":");
    const h = Number(hh);
    const m = Number(mm);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function MeetingsPage() {
    const [role, setRole] = useState("");
    const [schedules, setSchedules] = useState<ScheduleOption[]>([]);
    const [scheduleId, setScheduleId] = useState<string>("");
    const [mode, setMode] = useState<"upcoming" | "all">("upcoming");

    const [groups, setGroups] = useState<DayGroup[]>([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [loadingMeetings, setLoadingMeetings] = useState(false);

    const selectedSchedule = useMemo(
        () => schedules.find((s) => s.id === scheduleId),
        [schedules, scheduleId]
    );

    // 1) load schedules once
    useEffect(() => {
        const run = async () => {
            try {
                setLoadingSchedules(true);
                const res = await fetch("/api/meetings");
                const json: unknown = await res.json();

                if (!isApiResponse(json)) throw new Error("Unexpected server response.");
                if (!res.ok || "error" in json) throw new Error("error" in json ? json.error : "Failed to load schedules");

                const list = (json as MeetingsApiOk).schedules ?? [];
                setSchedules(list);
            } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to load schedules");
            } finally {
                setLoadingSchedules(false);
            }
        };

        run();
    }, []);

    // 2) load meetings when scheduleId/mode changes
    useEffect(() => {
        if (!scheduleId) return;

        // ✅ clear groups immediately to avoid "disappearing / stale first item" behavior
        setGroups([]);

        const controller = new AbortController();
        const run = async () => {
            try {
                setLoadingMeetings(true);

                const qs = new URLSearchParams({ scheduleId, mode });
                const res = await fetch(`/api/meetings?${qs.toString()}`, { signal: controller.signal });

                const json: unknown = await res.json();
                if (!isApiResponse(json)) throw new Error("Unexpected server response.");
                if (!res.ok || "error" in json) throw new Error("error" in json ? json.error : "Failed to load meetings");

                setGroups((json as MeetingsApiOk).groups ?? []);
            } catch (e) {
                if (e instanceof DOMException && e.name === "AbortError") return;
                toast.error(e instanceof Error ? e.message : "Failed to load meetings");
                setGroups([]);
            } finally {
                setLoadingMeetings(false);
            }
        };

        run();
        return () => controller.abort();
    }, [scheduleId, mode]);

    return (
        <NewSidebar active="meetings">
            <div className="py-4">
                <div className="py-10 px-8 border-b">
                    <h1 className="text-2xl font-bold">Meetings</h1>
                    <p className="text-sm text-muted-foreground">
                        View appointments grouped by date and time (Calendly-style).
                    </p>
                </div>

                <div className="p-8 space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg">Filters</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Pick a schedule and a view mode.
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                <Select
                                    value={scheduleId}
                                    onValueChange={(v) => setScheduleId(v)}
                                    disabled={loadingSchedules || schedules.length === 0}
                                >
                                    <SelectTrigger className="w-full sm:w-[320px]">
                                        <SelectValue placeholder={loadingSchedules ? "Loading schedules..." : "Select schedule"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schedules.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.title}{!s.enabled ? " (disabled)" : ""}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={mode} onValueChange={(v) => setMode(v as any)} disabled={!scheduleId}>
                                    <SelectTrigger className="w-full sm:w-[220px]">
                                        <SelectValue placeholder="Select view" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="upcoming">Upcoming (Today → End)</SelectItem>
                                        <SelectItem value="all">All (All appointments)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                {selectedSchedule ? (
                                    <>
                                        <Badge variant="secondary">
                                            {selectedSchedule.enabled ? "Enabled" : "Disabled"}
                                        </Badge>
                                        <span>
                                            Range: {selectedSchedule.date_start} → {selectedSchedule.date_end}
                                        </span>
                                    </>
                                ) : (
                                    <span>Select a schedule to view meetings.</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Appointments</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Click a time slot to see who booked.
                            </p>
                        </CardHeader>

                        <CardContent>
                            {loadingMeetings ? (
                                <div className="text-sm text-muted-foreground">Loading meetings...</div>
                            ) : !scheduleId ? (
                                <div className="text-sm text-muted-foreground">Select a schedule first.</div>
                            ) : groups.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    No appointments found for this view.
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {groups.map((g) => (
                                        <div key={g.date} className="space-y-2">
                                            <div className="text-sm font-semibold">{formatHeading(g.date)}</div>

                                            <Accordion type="multiple" className="w-full">
                                                {g.times.map((t) => {
                                                    const label = `${formatTime(t.start_time)} - ${formatTime(t.end_time)}`;
                                                    const count = t.appointments.length;

                                                    return (
                                                        <AccordionItem
                                                            key={`${g.date}-${t.time_id}`}
                                                            value={`${g.date}-${t.time_id}`}
                                                            className="border rounded-lg px-3"
                                                        >
                                                            <AccordionTrigger className="py-3 hover:no-underline">
                                                                <div className="flex w-full items-center justify-between gap-3">
                                                                    <div className="text-sm font-medium">{label}</div>
                                                                    <Badge variant={count ? "default" : "secondary"}>
                                                                        {count} booked
                                                                    </Badge>
                                                                </div>
                                                            </AccordionTrigger>

                                                            <AccordionContent className="pb-3">
                                                                {count === 0 ? (
                                                                    <div className="text-sm text-muted-foreground">
                                                                        No appointments for this time slot.
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        {t.appointments.map((a) => (
                                                                            <div
                                                                                key={a.id}
                                                                                className="rounded-md border bg-white p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                                                                            >
                                                                                <div className="min-w-0">
                                                                                    <div className="text-sm font-medium truncate">{a.name}</div>
                                                                                    <div className="text-xs text-muted-foreground truncate">{a.email}</div>
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {new Date(a.created_at).toLocaleString()}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    );
                                                })}
                                            </Accordion>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </NewSidebar>
    );
}