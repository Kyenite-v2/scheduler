import { createSupabaseClient } from "@/supabase/client";
import { NextResponse } from "next/server";

function toYmdLocal(d: Date) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export async function GET(req: Request) {
    try {
        const supabase = await createSupabaseClient();
        const { searchParams } = new URL(req.url);

        const scheduleId = searchParams.get("scheduleId") ?? "";
        const mode = (searchParams.get("mode") ?? "upcoming") as "upcoming" | "all";

        // 1) schedules for select
        const { data: schedules, error: schedErr } = await supabase
            .from("schedules")
            .select("id, title, date_start, date_end, enabled")
            .order("created_at", { ascending: false });

        if (schedErr) {
            return NextResponse.json({ error: schedErr.message }, { status: 500 });
        }

        if (!scheduleId) {
            return NextResponse.json({ schedules: schedules ?? [], groups: [] }, { status: 200 });
        }

        // 2) base appointments query (selected schedule)
        let q = supabase
            .from("appointments")
            .select(
                `
        id,
        date,
        name,
        email,
        created_at,
        time:time_id (
          id,
          start_time,
          end_time
        )
      `
            )
            .eq("schedule_id", scheduleId);

        // ✅ filtering rules
        if (mode === "upcoming") {
            const today = toYmdLocal(new Date());
            q = q.gte("date", today);
        }
        // mode === "all" -> no date filter at all

        const { data: rows, error: apptErr } = await q
            .order("date", { ascending: true })
            // ordering by nested time fields is not always supported consistently,
            // but ordering by time_id is usually good enough if time ids were created in order.
            .order("time_id", { ascending: true })
            .order("created_at", { ascending: true });

        if (apptErr) {
            return NextResponse.json({ error: apptErr.message }, { status: 500 });
        }

        // 3) group by date then time_id
        type Row = any;

        const byDate: Record<
            string,
            Record<
                number,
                {
                    time_id: number;
                    start_time: string;
                    end_time: string;
                    appointments: { id: number; name: string; email: string; created_at: string }[];
                }
            >
        > = {};

        for (const r of (rows ?? []) as Row[]) {
            const date = r.date as string; // YYYY-MM-DD
            const t = r.time;

            if (!t?.id) continue;

            const timeId = Number(t.id);

            byDate[date] ??= {};
            byDate[date][timeId] ??= {
                time_id: timeId,
                start_time: t.start_time,
                end_time: t.end_time,
                appointments: [],
            };

            byDate[date][timeId].appointments.push({
                id: r.id,
                name: r.name,
                email: r.email,
                created_at: r.created_at,
            });
        }

        const groups = Object.entries(byDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, timesMap]) => ({
                date,
                times: Object.values(timesMap).sort((a, b) => a.start_time.localeCompare(b.start_time)),
            }));

        return NextResponse.json(
            {
                schedules: schedules ?? [],
                groups,
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}