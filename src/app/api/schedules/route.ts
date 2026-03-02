import { createSupabaseServerClient } from "@/supabase/server";
import { NextResponse } from "next/server";

type TimeRow = { start_time: string; end_time: string };

type CreateBody = {
    title: string;
    date_start: string; // ISO from client
    date_end: string;   // ISO from client
    enabled?: boolean;
    disabledDays?: number[]; // 0..6 disabled
    slots: number;
    time: TimeRow[];
};

// PUT supports both toggle and edit
type PutToggleBody = { id: string; enabled: boolean };

type PutEditBody = {
    id: string;
    title: string;
    date_start: string; // ISO or YYYY-MM-DD
    date_end: string;   // ISO or YYYY-MM-DD
    enabled: boolean;
    disabledDays: number[];
    slots: number;
    time: TimeRow[];
};

function toDateOnly(input: string) {
    // accept either YYYY-MM-DD or ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

    const d = new Date(input);
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date");

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function normalizeTime(t: string) {
    if (!t) throw new Error("Empty time");
    if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
    if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
    throw new Error(`Invalid time format: ${t}`);
}

function normalizeDisabledDays(disabledDays: number[] = []) {
    return Array.from(new Set(disabledDays))
        .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
        .sort((a, b) => a - b);
}

function rangesOverlap(a: { s: string; e: string }, b: { s: string; e: string }) {
    return a.s < b.e && b.s < a.e;
}

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient();

        // schedules
        const { data: schedules, error: schedErr } = await supabase
            .from("schedules")
            .select("id, title, date_start, date_end, slots, week, enabled")
            .order("date_start", { ascending: true });

        if (schedErr) {
            return NextResponse.json({ error: schedErr.message }, { status: 500 });
        }

        const ids = (schedules ?? []).map((s) => s.id);
        if (ids.length === 0) return NextResponse.json([], { status: 200 });

        // times
        const { data: times, error: timeErr } = await supabase
            .from("time")
            .select("id, schedule_id, start_time, end_time")
            .in("schedule_id", ids)
            .order("start_time", { ascending: true });

        if (timeErr) {
            return NextResponse.json({ error: timeErr.message }, { status: 500 });
        }

        const bySchedule: Record<string, any[]> = {};
        for (const t of times ?? []) {
            (bySchedule[t.schedule_id] ??= []).push({
                id: t.id,
                start_time: t.start_time,
                end_time: t.end_time,
            });
        }

        const merged = (schedules ?? []).map((s) => ({
            ...s,
            time: bySchedule[s.id] ?? [],
        }));

        return NextResponse.json(merged, { status: 200 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createSupabaseServerClient();
        const body = (await req.json()) as Partial<CreateBody>;

        const title = (body.title ?? "").trim();
        if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

        if (!body.date_start || !body.date_end) {
            return NextResponse.json({ error: "date_start and date_end are required" }, { status: 400 });
        }

        const date_start = toDateOnly(body.date_start);
        const date_end = toDateOnly(body.date_end);
        if (date_end < date_start) {
            return NextResponse.json({ error: "date_end must be on/after date_start" }, { status: 400 });
        }

        const slots = Number(body.slots);
        if (!Number.isFinite(slots) || slots <= 0 || slots > 32767) {
            return NextResponse.json({ error: "slots must be a positive smallint" }, { status: 400 });
        }

        const enabled = Boolean(body.enabled);

        const timeRows = Array.isArray(body.time) ? body.time : [];
        if (!timeRows.length) {
            return NextResponse.json({ error: "At least one time range is required" }, { status: 400 });
        }

        const normalized = timeRows.map((t, i) => {
            const s = normalizeTime(t.start_time);
            const e = normalizeTime(t.end_time);
            if (s >= e) throw new Error(`Time row #${i + 1}: start_time must be before end_time`);
            return { s, e };
        });

        const sorted = [...normalized].sort((a, b) => a.s.localeCompare(b.s));
        for (let i = 0; i < sorted.length - 1; i++) {
            if (rangesOverlap(sorted[i], sorted[i + 1])) {
                return NextResponse.json({ error: "Time ranges overlap" }, { status: 400 });
            }
        }

        // ✅ week is ARRAY (disabled days)
        const week = normalizeDisabledDays(body.disabledDays ?? []);

        const { data: schedule, error: schedErr } = await supabase
            .from("schedules")
            .insert({ title, date_start, date_end, slots, week, enabled })
            .select("id, title, date_start, date_end, slots, week, enabled")
            .single();

        if (schedErr) return NextResponse.json({ error: schedErr.message }, { status: 400 });

        const { data: insertedTimes, error: timeErr } = await supabase
            .from("time")
            .insert(normalized.map((t) => ({ schedule_id: schedule.id, start_time: t.s, end_time: t.e })))
            .select("id, start_time, end_time")
            .order("start_time", { ascending: true });

        if (timeErr) {
            await supabase.from("schedules").delete().eq("id", schedule.id);
            return NextResponse.json({ error: timeErr.message }, { status: 400 });
        }

        return NextResponse.json(
            { ok: true, data: { ...schedule, time: insertedTimes ?? [] } },
            { status: 201 }
        );
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? "Unexpected server error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const supabase = await createSupabaseServerClient();
        const body = (await req.json()) as Partial<PutToggleBody & PutEditBody>;

        const id = String(body.id ?? "");
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        // ✅ toggle-only request: {id, enabled}
        if (typeof body.enabled === "boolean" && !("title" in body) && !("time" in body)) {
            const { data: updated, error: updErr } = await supabase
                .from("schedules")
                .update({ enabled: body.enabled })
                .eq("id", id)
                .select("id, title, date_start, date_end, slots, week, enabled")
                .single();

            if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

            const { data: times } = await supabase
                .from("time")
                .select("id, start_time, end_time")
                .eq("schedule_id", id)
                .order("start_time", { ascending: true });

            return NextResponse.json({ message: "Updated successfully!", data: { ...updated, time: times ?? [] } }, { status: 200 });
        }

        // ✅ full edit
        const title = (body.title ?? "").trim();
        if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

        if (!body.date_start || !body.date_end) {
            return NextResponse.json({ error: "date_start and date_end are required" }, { status: 400 });
        }

        const date_start = toDateOnly(body.date_start);
        const date_end = toDateOnly(body.date_end);
        if (date_end < date_start) {
            return NextResponse.json({ error: "date_end must be on/after date_start" }, { status: 400 });
        }

        const slots = Number(body.slots);
        if (!Number.isFinite(slots) || slots <= 0 || slots > 32767) {
            return NextResponse.json({ error: "slots must be a positive smallint" }, { status: 400 });
        }

        const enabled = Boolean(body.enabled);

        // ✅ week is ARRAY (disabled days)
        const week = normalizeDisabledDays(body.disabledDays ?? []);

        const timeRows = Array.isArray(body.time) ? body.time : [];
        if (!timeRows.length) {
            return NextResponse.json({ error: "At least one time range is required" }, { status: 400 });
        }

        const normalized = timeRows.map((t, i) => {
            const s = normalizeTime(t.start_time);
            const e = normalizeTime(t.end_time);
            if (s >= e) throw new Error(`Time row #${i + 1}: start_time must be before end_time`);
            return { s, e };
        });

        const sorted = [...normalized].sort((a, b) => a.s.localeCompare(b.s));
        for (let i = 0; i < sorted.length - 1; i++) {
            if (rangesOverlap(sorted[i], sorted[i + 1])) {
                return NextResponse.json({ error: "Time ranges overlap" }, { status: 400 });
            }
        }

        const { data: updated, error: updErr } = await supabase
            .from("schedules")
            .update({ title, date_start, date_end, slots, week, enabled })
            .eq("id", id)
            .select("id, title, date_start, date_end, slots, week, enabled")
            .single();

        if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

        // replace times for this schedule
        const { error: delErr } = await supabase.from("time").delete().eq("schedule_id", id);
        if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

        const { data: insertedTimes, error: insErr } = await supabase
            .from("time")
            .insert(normalized.map((t) => ({ schedule_id: id, start_time: t.s, end_time: t.e })))
            .select("id, start_time, end_time")
            .order("start_time", { ascending: true });

        if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

        return NextResponse.json(
            { message: "Updated successfully!", data: { ...updated, time: insertedTimes ?? [] } },
            { status: 200 }
        );
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? "Unexpected server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = await createSupabaseServerClient();

        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const { error: schedErr } = await supabase.from("schedules").delete().eq("id", id);
        if (schedErr) return NextResponse.json({ error: schedErr.message }, { status: 500 });

        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}