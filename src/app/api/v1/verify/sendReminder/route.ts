import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/supabase/server";
import { createReminderEmail } from "@/lib/email";

function getTomorrowDateStringPH(): string {
    const now = new Date();

    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(now);

    const y = Number(parts.find(p => p.type === "year")?.value);
    const m = Number(parts.find(p => p.type === "month")?.value);
    const d = Number(parts.find(p => p.type === "day")?.value);

    const todayUTC = new Date(Date.UTC(y, m - 1, d));
    todayUTC.setUTCDate(todayUTC.getUTCDate() + 1);

    const yy = todayUTC.getUTCFullYear();
    const mm = String(todayUTC.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(todayUTC.getUTCDate()).padStart(2, "0");
    return `${yy}-${mm}-${dd}`;
}

function formatTimeHHMM(time: string): string {
    if (!time) return "";
    return time.length >= 5 ? time.slice(0, 5) : time;
}

function prettyDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
    return new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Manila",
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(dt);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const tomorrow = getTomorrowDateStringPH();

    const { data, error } = await supabase
        .from("appointments")
        .select(
            `
      id,
      date,
      name,
      email,
      schedules: schedule_id ( title ),
      time: time_id ( start_time, end_time )
    `
        )
        .eq("date", tomorrow);

    if (error) {
        return NextResponse.json(
            { error: "Failed to fetch appointments", details: error.message },
            { status: 500 }
        );
    }

    const appointments = data ?? [];

    if (appointments.length === 0) {
        return NextResponse.json({
            ok: true,
            tomorrow,
            count: 0,
            message: "No appointments for tomorrow.",
        });
    }

    const results = await Promise.allSettled(
        appointments.map(async (appt: any) => {
            const title = appt?.schedules?.title ?? "Appointment";
            const start = formatTimeHHMM(appt?.time?.start_time ?? "");
            const end = formatTimeHHMM(appt?.time?.end_time ?? "");
            const timeRange = start && end ? `${start} - ${end}` : start || end || "";

            await createReminderEmail(
                appt.name,
                appt.email,
                title,
                prettyDate(tomorrow),
                timeRange
            );

            return { id: appt.id, email: appt.email };
        })
    );

    const sent = results
        .map((r, idx) => (r.status === "fulfilled" ? appointments[idx]?.email : null))
        .filter(Boolean);

    const failed = results
        .map((r, idx) =>
            r.status === "rejected"
                ? { id: appointments[idx]?.id, email: appointments[idx]?.email, reason: String(r.reason) }
                : null
        )
        .filter(Boolean);

    return NextResponse.json({
        ok: true,
        tomorrow,
        count: appointments.length,
        sentCount: sent.length,
        failedCount: failed.length,
        failed,
    });
}