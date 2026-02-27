import { createSupabaseServerClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required." });
    }
    if (email.includes("@") === false) {
        return NextResponse.json({ error: "Invalid email format." });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return NextResponse.json({ error: error.message });
    }

    return NextResponse.json({ message: "Login successful" }, { status: 200 });
}