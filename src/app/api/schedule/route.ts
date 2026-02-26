import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/supabase/server";

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
  const { scheduleId, date, timeId, name, email } = body as {
    scheduleId?: string;
    date?: string;
    timeId?: number;
    name?: string;
    email?: string;
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

  return NextResponse.json({ message: "Appointment scheduled successfully!" });
}