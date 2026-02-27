import { createSupabaseServerClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = await createSupabaseServerClient();
    const { data: schedules, error } = await supabase.from("schedules").select("*");

    if(error) {
        return NextResponse.json({ error: "There seems to be an error fetching the data." }, { status: 404 });
    }

    return NextResponse.json(schedules);
}