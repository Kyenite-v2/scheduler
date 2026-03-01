import NotFound from "@/app/components/not-found";
import Scheduler from "@/app/components/scheduler";
import { createSupabaseServerClient } from "@/supabase/server";

type ScheduleData = {
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

function isNumberArray(value: unknown): value is number[] {
    return Array.isArray(value) && value.every((v) => typeof v === "number" && Number.isFinite(v));
}

function normalizeWeek(week: unknown): number[] {
    if (isNumberArray(week)) return week;

    if (Array.isArray(week) && week.every((v) => typeof v === "string")) {
        return week
            .map((v) => Number(v))
            .filter((n) => Number.isFinite(n));
    }

    return [];
}

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();

    const { data: schedule } = await supabase
        .from("schedules")
        .select("id, title, date_start, date_end, slots, week, enabled")
        .eq("id", id)
        .maybeSingle();

    if (!schedule || !schedule.enabled) return <NotFound />;

    const { data: times } = await supabase
        .from("time")
        .select("id, start_time, end_time")
        .eq("schedule_id", id)
        .order("start_time", { ascending: true });

    const fixedSchedule: ScheduleData = {
        id: schedule.id,
        title: schedule.title,
        date_start: schedule.date_start,
        date_end: schedule.date_end,
        slots: schedule.slots,
        week: normalizeWeek((schedule as { week: unknown }).week),
    };

    return <Scheduler schedule={fixedSchedule} times={(times ?? []) as TimeData[]} />;
}