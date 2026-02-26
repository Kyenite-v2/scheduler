import { createSupabaseServerClient } from "@/supabase/server";

export async function POST(request: Request) {
    const { email, password } = await request.json();

    if(!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password are required." }));
    }
    if(email.includes("@") === false) {
        return new Response(JSON.stringify({ error: "Invalid email format." }));
    }
    
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if(error) {
        return new Response(JSON.stringify({ error: error.message }));
    }

    return new Response(JSON.stringify({ message: "Login successful." }), { status: 200 });
}