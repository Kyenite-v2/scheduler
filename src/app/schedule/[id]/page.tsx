import NotFound from "@/app/components/not-found";
import Scheduler from "@/app/components/scheduler";
import { createSupabaseServerClient } from "@/supabase/server";

type ScheduleData = {
    id: string;
    title: string;
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
    // already number[]
    if (isNumberArray(week)) return week;

    // string[] -> number[]
    if (Array.isArray(week) && week.every((v) => typeof v === "string")) {
        return week
            .map((v) => Number(v))
            .filter((n) => Number.isFinite(n));
    }

    // other jsonb shapes => empty
    return [];
}

export default async function SchedulePage({ params }: { params: { id: string } }) {
    const supabase = await createSupabaseServerClient();

    const { data: schedule } = await supabase
        .from("schedules")
        .select("id, title, slots, week")
        .eq("id", params.id)
        .maybeSingle();

    if (!schedule) return <NotFound />;

    const { data: times } = await supabase
        .from("time")
        .select("id, start_time, end_time")
        .eq("schedule_id", params.id)
        .order("start_time", { ascending: true });

    const fixedSchedule: ScheduleData = {
        id: schedule.id,
        title: schedule.title,
        slots: schedule.slots,
        week: normalizeWeek((schedule as { week: unknown }).week),
    };

    return <Scheduler schedule={fixedSchedule} times={(times ?? []) as TimeData[]} />;
}