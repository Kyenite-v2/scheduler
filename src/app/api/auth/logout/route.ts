import { createSupabaseServerClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signOut();
    if (error) {
        return NextResponse.json(
            { error: "There seems to be a problem. Please try again later." },
            { status: 400 }
        );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
}