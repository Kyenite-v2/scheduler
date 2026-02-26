import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export default async function proxy(request: Request) {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookieToSet) {
                try {
                    cookieToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    })
                } catch (e) {

                }
            }
        }
    });

    const { data: { session } } = await supabase.auth.getSession();

    if(!session) {
        return NextResponse.redirect(new URL("/login", request.url));
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: [
        "/a/:path*",
    ]
}