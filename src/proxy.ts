import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

type Role = "admin" | "user";

export async function proxy(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create a response we can attach cookies to
    let response = NextResponse.next();

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                // Apply cookie changes to the outgoing response
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options);
                });
            },
        },
    });

    // 1) Require session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        const redirect = NextResponse.redirect(new URL("/login", request.url));
        return redirect;
    }

    // 2) Fetch app setting: disable_non_admin_login (default false)
    const { data: settingsRow } = await supabase
        .from("app_settings")
        .select("disable_non_admin_login")
        .limit(1)
        .maybeSingle();

    const disableNonAdminLogin = settingsRow?.disable_non_admin_login ?? false;

    // 3) Fetch users_info: role + active
    const { data: info } = await supabase
        .from("users_info")
        .select("role, active")
        .eq("user_id", user.id)
        .maybeSingle();

    const role = (info?.role ?? "user") as Role;
    const active = info?.active ?? true;

    // 4) Enforce rules:
    // - if users_info.active is false -> logout + redirect to /login
    // - if app setting disables non-admin login AND user isn't admin -> logout + redirect
    const mustLogout = active === false || (disableNonAdminLogin && role !== "admin");

    if (mustLogout) {
        // sign out to clear auth cookies
        await supabase.auth.signOut();

        const redirect = NextResponse.redirect(new URL("/login", request.url));

        // IMPORTANT: carry over any cookie clears that signOut wrote into `response`
        response.cookies.getAll().forEach((c) => {
            redirect.cookies.set(c);
        });

        return redirect;
    }

    return response;
}

export const config = {
    matcher: ["/a/:path*"],
};