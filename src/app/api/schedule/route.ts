import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/supabase/server";
import { createSendEmail } from "@/lib/email";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scheduleId = url.searchParams.get("scheduleId");
  const date = url.searchParams.get("date"); // YYYY-MM-DD

  if (!scheduleId || !date) {
    return NextResponse.json({ error: "Missing scheduleId or date" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("count_appointments_by_time_for_date", {
    p_schedule_id: scheduleId,
    p_date: date,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();

  const { scheduleId, date, timeId, name, email, timeText, title } = body as {
    scheduleId?: string;
    date?: string;
    timeId?: number;
    name?: string;
    email?: string;
    timeText?: string;
    title?: string;
  };

  if (!scheduleId || !date || !timeId || !name || !email) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  if (name.trim() === "") {
    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: schedule, error: scheduleError } = await supabase
    .from("schedules")
    .select("date_start, date_end, week, enabled")
    .eq("id", scheduleId)
    .single();

  if (scheduleError || !schedule) {
    return NextResponse.json({ error: "Schedule not found." }, { status: 404 });
  }

  if (!schedule.enabled) {
    return NextResponse.json({ error: "Schedule is disabled." }, { status: 400 });
  }

  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);

  const start = new Date(schedule.date_start);
  start.setHours(0, 0, 0, 0);

  const end = new Date(schedule.date_end);
  end.setHours(0, 0, 0, 0);

  if (selectedDate < start || selectedDate > end) {
    return NextResponse.json(
      { error: "Date is outside the allowed schedule range." },
      { status: 400 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (selectedDate < tomorrow) {
    return NextResponse.json(
      { error: "Bookings must be at least one day in advance." },
      { status: 400 }
    );
  }

  const dayOfWeek = selectedDate.getDay();

  if (Array.isArray(schedule.week) && schedule.week.includes(dayOfWeek)) {
    return NextResponse.json(
      { error: "This day is disabled for booking." },
      { status: 400 }
    );
  }

  const { error } = await supabase.rpc("create_appointment_checked", {
    p_schedule_id: scheduleId,
    p_time_id: timeId,
    p_date: date,
    p_name: name,
    p_email: email,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    await createSendEmail(name, email, title as string, date, timeText as string);
  } catch (e) {
    return NextResponse.json({
      message: "Appointment scheduled successfully! (Email failed to send)",
    });
  }

  return NextResponse.json({
    message: "Appointment scheduled successfully!",
  });
}

export async function PUT(request: Request) {
  const { id, enabled } = await request.json();

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("schedules").update({ enabled }).eq("id", id);
  if (error) {
    return NextResponse.json({ error: "There is a problem in updating the schedule." }, { status: 401 });
  }

  return NextResponse.json({ message: "Updated successfully!" });
}