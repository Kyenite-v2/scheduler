import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/supabase/server";

export async function GET() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ role: null }, { status: 401 });
    }

    const { data, error } = await supabase
        .from("users_info")
        .select("role")
        .eq("user_id", user.id) // change if your column is different
        .single();

    if (error) {
        return NextResponse.json({ role: null }, { status: 500 });
    }

    return NextResponse.json({ role: data.role });
}