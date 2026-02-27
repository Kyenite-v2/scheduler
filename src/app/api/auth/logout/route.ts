import { createSupabaseServerClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signOut();
    if(error) {
        return NextResponse.json({ error: "There seems to be a problem. Please try again later." }, { status: 401 })
    }

    return NextResponse.redirect(new URL("/login", request.url))
}