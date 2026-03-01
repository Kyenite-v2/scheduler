import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createReminderEmail } from "@/lib/email";
import { createSupabaseServerClient } from "@/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get("secret");

        // Require secret (more secure than optional)
        if (!process.env.CRON_SECRET) {
            return NextResponse.json({ error: "CRON_SECRET is not set" }, { status: 500 });
        }
        if (secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate env early (common 500 cause)
        const missing: string[] = [];
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
        if (!process.env.SMTP_HOST) missing.push("SMTP_HOST");
        if (!process.env.SMTP_USER) missing.push("SMTP_USER");
        if (!process.env.SMTP_PASS) missing.push("SMTP_PASS");

        if (missing.length) {
            return NextResponse.json({ error: "Missing env vars", missing }, { status: 500 });
        }

        // Admin client for cron jobs (no cookies/session)
        const supabase = await createSupabaseServerClient();

        const tomorrow = getTomorrowDateStringPH();
  
        const { data, error } = await supabase
            .from("appointments")
            .select(`
        id,
        date,
        name,
        email,
        schedules:schedule_id ( title ),
        time:time_id ( start_time, end_time )
      `)
            .eq("date", tomorrow);

        if (error) {
            console.error("Supabase fetch error:", error);
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

        const sent = results.filter(r => r.status === "fulfilled").length;
        const failed = results.filter(r => r.status === "rejected").length;

        // Log failed reasons to Vercel logs
        results.forEach((r, i) => {
            if (r.status === "rejected") {
                console.error("Email failed:", appointments[i]?.email, r.reason);
            }
        });

        return NextResponse.json({
            ok: true,
            tomorrow,
            count: appointments.length,
            sentCount: sent,
            failedCount: failed,
        });
    } catch (e: any) {
        console.error("Route crashed:", e);
        return NextResponse.json(
            { error: "Internal Server Error", details: e?.message ?? String(e) },
            { status: 500 }
        );
    }
}