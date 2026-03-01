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

  // ✅ atomic insert + capacity check
  const { error } = await supabase.rpc("create_appointment_checked", {
    p_schedule_id: scheduleId,
    p_time_id: timeId,
    p_date: date,
    p_name: name,
    p_email: email,
  });

  if (error) {
    // Most RPC validation errors should be 400 (not 500)
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    await createSendEmail(name, email, title as string, date, timeText as string);
  } catch (e) {
    return NextResponse.json({ error: "Appointment scheduled successfully!" });
  }
  return NextResponse.json({ message: "Appointment scheduled successfully!" });
}

export async function  PUT(request: Request) {
  const { id, enabled } = await request.json();

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("schedules").update({enabled}).eq("id", id);
  if(error) {
    return NextResponse.json({ error: "There is a problem in updating the schedule." }, { status: 401 });
  }

  return NextResponse.json({ message: "Updated successfully!" });
}