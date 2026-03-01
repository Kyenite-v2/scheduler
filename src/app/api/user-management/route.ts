import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/supabase/admin";
import { createSupabaseServerClient } from "@/supabase/server";

type Role = "admin" | "user";

function isRole(x: any): x is Role {
    return x === "admin" || x === "user";
}

/**
 * Only admins can use this endpoint at all.
 * We authenticate the caller using the normal server client (cookies),
 * then check their role in users_info.
 */
async function requireAdmin() {
    const supabase = await createSupabaseServerClient();

    const {
        data: { user },
        error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
        return { ok: false as const, status: 401, error: "Unauthorized" };
    }

    const { data: info, error: infoErr } = await supabase
        .from("users_info")
        .select("role, active")
        .eq("user_id", user.id)
        .single();

    if (infoErr || !info) {
        return { ok: false as const, status: 403, error: "Forbidden" };
    }

    // Optional: block disabled accounts from using admin endpoints
    if (info.active === false) {
        return { ok: false as const, status: 403, error: "Account disabled" };
    }

    if (info.role !== "admin") {
        return { ok: false as const, status: 403, error: "Admins only" };
    }

    return { ok: true as const, userId: user.id };
}

export async function GET() {
    const gate = await requireAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    try {
        const admin = createSupabaseAdminClient();

        // settings (single row)
        const { data: settingsRow, error: setErr } = await admin
            .from("app_settings")
            .select("disable_non_admin_login")
            .limit(1)
            .maybeSingle();

        if (setErr) return NextResponse.json({ error: setErr.message }, { status: 500 });

        // list auth users
        const { data: list, error: listErr } = await admin.auth.admin.listUsers();
        if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

        const authUsers = list.users ?? [];
        const ids = authUsers.map((u) => u.id);

        // users_info rows
        const { data: infos, error: infoErr } = await admin
            .from("users_info")
            .select("user_id, role, active")
            .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

        if (infoErr) return NextResponse.json({ error: infoErr.message }, { status: 500 });

        const infoMap = new Map<string, { role: Role; active: boolean }>();
        for (const row of infos ?? []) {
            infoMap.set(row.user_id, { role: row.role, active: row.active });
        }

        const users = authUsers.map((u) => {
            const info = infoMap.get(u.id);
            return {
                id: u.id,
                email: u.email ?? "",
                created_at: u.created_at,
                last_sign_in_at: u.last_sign_in_at,
                verified: !!u.email_confirmed_at,
                role: (info?.role ?? "user") as Role,
                active: info?.active ?? true,
            };
        });

        return NextResponse.json(
            {
                settings: { disable_non_admin_login: settingsRow?.disable_non_admin_login ?? false },
                users,
            },
            { status: 200 }
        );
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const gate = await requireAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    try {
        const admin = createSupabaseAdminClient();
        const body = await req.json();

        const email = String(body.email ?? "").trim().toLowerCase();
        const password = String(body.password ?? "");
        const verify = Boolean(body.verify);
        const role = body.role;

        if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
        if (!password || password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
        }
        if (!isRole(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });

        // create auth user
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: verify,
        });

        if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });
        const userId = created.user?.id;
        if (!userId) return NextResponse.json({ error: "Failed to create user" }, { status: 500 });

        // insert users_info
        const { error: infoErr } = await admin.from("users_info").insert({
            user_id: userId,
            role,
            active: true,
        });

        if (infoErr) {
            // cleanup auth user if profile insert fails
            await admin.auth.admin.deleteUser(userId);
            return NextResponse.json({ error: infoErr.message }, { status: 400 });
        }

        return NextResponse.json({ message: "User created successfully" }, { status: 201 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const gate = await requireAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    try {
        const admin = createSupabaseAdminClient();
        const body = await req.json();

        // Update global setting
        if (body.type === "settings") {
            const disable = Boolean(body.disable_non_admin_login);

            const { data: row } = await admin.from("app_settings").select("id").limit(1).maybeSingle();
            if (!row?.id) {
                const { error: insErr } = await admin.from("app_settings").insert({ disable_non_admin_login: disable });
                if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 });
            } else {
                const { error: upErr } = await admin
                    .from("app_settings")
                    .update({ disable_non_admin_login: disable })
                    .eq("id", row.id);

                if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });
            }

            return NextResponse.json({ message: "Settings updated" }, { status: 200 });
        }

        // Update a user
        const id = String(body.id ?? "");
        if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

        // ✅ Rule: you may edit your own account, but you cannot disable yourself
        if (id === gate.userId && body.active === false) {
            return NextResponse.json({ error: "You cannot disable your own account." }, { status: 400 });
        }

        const role = body.role;
        const active = body.active;
        const verify = body.verify;
        const newPassword = body.password;

        // update users_info role/active (if provided)
        const patchInfo: any = {};
        if (role !== undefined) {
            if (!isRole(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
            patchInfo.role = role;
        }
        if (active !== undefined) patchInfo.active = Boolean(active);

        if (Object.keys(patchInfo).length) {
            const { error: infoErr } = await admin.from("users_info").update(patchInfo).eq("user_id", id);
            if (infoErr) return NextResponse.json({ error: infoErr.message }, { status: 400 });
        }

        // update auth user verify/password (if provided)
        const patchAuth: any = {};
        if (verify !== undefined) patchAuth.email_confirm = Boolean(verify);
        if (newPassword !== undefined) {
            const pw = String(newPassword);
            if (pw.length < 6) {
                return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
            }
            patchAuth.password = pw;
        }

        if (Object.keys(patchAuth).length) {
            const { error: authErr } = await admin.auth.admin.updateUserById(id, patchAuth);
            if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });
        }

        return NextResponse.json({ message: "User updated" }, { status: 200 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const gate = await requireAdmin();
    if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

    try {
        const admin = createSupabaseAdminClient();
        const body = await req.json();

        const id = String(body.id ?? "");
        if (!id) return NextResponse.json({ error: "Missing user id" }, { status: 400 });

        // ✅ Also prevent deleting yourself (recommended)
        if (id === gate.userId) {
            return NextResponse.json({ error: "You cannot delete your own account here." }, { status: 400 });
        }

        // delete auth user (users_info will cascade delete if FK is set)
        const { error } = await admin.auth.admin.deleteUser(id);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });

        return NextResponse.json({ message: "User deleted" }, { status: 200 });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
    }
}