import { createSupabaseServerClient } from "@/supabase/server";
import { NextResponse } from "next/server";

type TimeRow = { start_time: string; end_time: string };
type Body = { title: string; date_start: string; date_end: string; enabled?: boolean; disabledDays?: number[]; slots: number; time: TimeRow[] };

function toDateOnly(iso: string) {
    const d = new Date(iso);
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

function buildWeekJson(disabledDays: number[] = []) {
    const all = [0, 1, 2, 3, 4, 5, 6];
    const disabled = Array.from(new Set(disabledDays)).filter(n => Number.isInteger(n) && n >= 0 && n <= 6).sort((a, b) => a - b);
    const available = all.filter(d => !disabled.includes(d));
    return { disabled, available };
}

function rangesOverlap(a: { s: string; e: string }, b: { s: string; e: string }) {
    return a.s < b.e && b.s < a.e;
}

export async function GET() {
    try {
        const supabase = await createSupabaseServerClient(); // ✅ inside request scope
        const { data: schedules, error } = await supabase.from("schedules").select("*");
        if (error) return NextResponse.json({ error: "There seems to be an error fetching the data." }, { status: 500 });
        return NextResponse.json(schedules ?? [], { status: 200 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createSupabaseServerClient(); // ✅ inside request scope
        const body = (await req.json()) as Body;

        const title = (body.title ?? "").trim();
        if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
        if (!body.date_start || !body.date_end) return NextResponse.json({ error: "date_start and date_end are required" }, { status: 400 });

        const date_start = toDateOnly(body.date_start);
        const date_end = toDateOnly(body.date_end);
        if (date_end < date_start) return NextResponse.json({ error: "date_end must be on/after date_start" }, { status: 400 });

        const slots = Number(body.slots);
        if (!Number.isFinite(slots) || slots <= 0 || slots > 32767) return NextResponse.json({ error: "slots must be a positive smallint" }, { status: 400 });

        const enabled = Boolean(body.enabled);
        const timeRows = Array.isArray(body.time) ? body.time : [];
        if (!timeRows.length) return NextResponse.json({ error: "At least one time range is required" }, { status: 400 });

        const normalized = timeRows.map((t, i) => {
            const s = normalizeTime(t.start_time);
            const e = normalizeTime(t.end_time);
            if (s >= e) throw new Error(`Time row #${i + 1}: start_time must be before end_time`);
            return { s, e };
        });

        const sorted = [...normalized].sort((a, b) => a.s.localeCompare(b.s));
        for (let i = 0; i < sorted.length - 1; i++) if (rangesOverlap(sorted[i], sorted[i + 1])) return NextResponse.json({ error: "Time ranges overlap" }, { status: 400 });

        const week = buildWeekJson(body.disabledDays);

        const { data: schedule, error: schedErr } = await supabase.from("schedules").insert({ title, date_start, date_end, slots, week, enabled }).select("id").single();
        if (schedErr) return NextResponse.json({ error: schedErr.message }, { status: 400 });

        const { error: timeErr } = await supabase.from("time").insert(normalized.map(t => ({ schedule_id: schedule.id, start_time: t.s, end_time: t.e })));
        if (timeErr) { await supabase.from("schedules").delete().eq("id", schedule.id); return NextResponse.json({ error: timeErr.message }, { status: 400 }); }

        return NextResponse.json({ ok: true, id: schedule.id }, { status: 201 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? "Unexpected server error" }, { status: 500 });
    }
}