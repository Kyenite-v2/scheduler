"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, BadgeCheck, BadgeX } from "lucide-react";
import NewSidebar from "@/app/components/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";

type Role = "admin" | "user";

type UserRow = {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string | null;
    verified: boolean;
    role: Role;
    active: boolean;
};

type ApiResponse =
    | { settings: { disable_non_admin_login: boolean }; users: UserRow[] }
    | { error: string };

function isApiResponse(x: unknown): x is ApiResponse {
    return typeof x === "object" && x !== null && ("error" in x || ("users" in x && "settings" in x));
}

export default function UserManagementPage() {
    const [loading, setLoading] = useState(true);
    const [savingSetting, setSavingSetting] = useState(false);
    const [disableNonAdminLogin, setDisableNonAdminLogin] = useState(false);
    const [users, setUsers] = useState<UserRow[]>([]);

    const refresh = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/user-management");
            const json: unknown = await res.json();

            if (!isApiResponse(json)) throw new Error("Unexpected server response.");
            if (!res.ok || "error" in json) throw new Error("error" in json ? json.error : "Failed to load users");

            setDisableNonAdminLogin(json.settings.disable_non_admin_login);
            setUsers(json.users);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to load user management");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const updateSetting = async (next: boolean) => {
        if (savingSetting) return;
        setSavingSetting(true);

        // optimistic
        const prev = disableNonAdminLogin;
        setDisableNonAdminLogin(next);

        try {
            const res = await fetch("/api/user-management", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "settings", disable_non_admin_login: next }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setDisableNonAdminLogin(prev);
                toast.error(data?.error ?? "Failed to update setting");
                return;
            }

            toast.success("Setting updated");
        } catch {
            setDisableNonAdminLogin(prev);
            toast.error("Failed to update setting");
        } finally {
            setSavingSetting(false);
        }
    };

    return (
        <NewSidebar active="user_management">
            <div>
                <div className="shadow bg-green-600 py-14 px-8 border-b flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="text-white md:hidden" />
                        <div>
                            <h1 className="text-white text-2xl font-bold">User Management</h1>
                            <p className="text-sm text-gray-50">
                                Create users, assign roles, and control who can log in.
                            </p>
                        </div>
                    </div>
                    <CreateUserDialog onCreated={refresh} />
                </div>

                <div className="p-8 space-y-4">
                    <Card>
                        <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg">Login Control</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    When enabled, only admins are allowed to log in.
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-sm text-muted-foreground">
                                    Disable non-admin login
                                </div>
                                <Switch
                                    checked={disableNonAdminLogin}
                                    onCheckedChange={updateSetting}
                                    disabled={savingSetting || loading}
                                    className="data-[state=checked]:bg-green-600"
                                />
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Users</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Admins can edit other users and disable accounts.
                            </p>
                        </CardHeader>

                        <CardContent>
                            {loading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="rounded-xl border p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="space-y-2 w-full">
                                                    <Skeleton className="h-4 w-52" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                                <Skeleton className="h-8 w-24" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : users.length === 0 ? (
                                <div className="text-sm text-muted-foreground">No users found.</div>
                            ) : (
                                <div className="space-y-2">
                                    {users.map((u) => (
                                        <UserCard key={u.id} user={u} onChanged={refresh} />
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </NewSidebar>
    );
}

function UserCard({ user, onChanged }: { user: UserRow; onChanged: () => void }) {
    const [busy, setBusy] = useState(false);

    const toggleActive = async (next: boolean) => {
        if (busy) return;
        setBusy(true);
        try {
            const res = await fetch("/api/user-management", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id, active: next }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to update user");
                return;
            }
            toast.success("User updated");
            onChanged();
        } finally {
            setBusy(false);
        }
    };

    const deleteUser = async () => {
        if (busy) return;
        if (!confirm(`Delete user ${user.email}?`)) return;

        setBusy(true);
        try {
            const res = await fetch("/api/user-management", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to delete user");
                return;
            }
            toast.success("User deleted");
            onChanged();
        } finally {
            setBusy(false);
        }
    };

    return (
        <Card className="rounded-2xl">
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium truncate">{user.email}</div>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                {user.role}
                            </Badge>
                            {!user.active ? <Badge variant="destructive">disabled</Badge> : null}
                            {user.verified ? <Badge variant="secondary" className="bg-blue-600 flex flex-wrap gap-2"><BadgeCheck data-icon="inline-start" /> verified</Badge> : <Badge variant="outline" className="flex flex-wrap gap-2"><BadgeX data-icon="inline-start" />unverified</Badge>}
                        </div>

                        <div className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(user.created_at).toLocaleString()}
                            {user.last_sign_in_at ? ` • Last login: ${new Date(user.last_sign_in_at).toLocaleString()}` : ""}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-end">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Active</span>
                            <Switch
                                checked={user.active}
                                onCheckedChange={toggleActive}
                                disabled={busy}
                                className="data-[state=checked]:bg-green-600"
                            />
                        </div>

                        <EditUserDialog user={user} onSaved={onChanged} />

                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={deleteUser}
                            disabled={busy}
                            aria-label="Delete user"
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [verify, setVerify] = useState(true);
    const [role, setRole] = useState<Role>("user");

    const submit = async () => {
        if (saving) return;

        const e = email.trim().toLowerCase();
        if (!e) return toast.error("Email is required");
        if (!password || password.length < 6) return toast.error("Password must be at least 6 characters");

        setSaving(true);
        try {
            const res = await fetch("/api/user-management", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: e, password, verify, role }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to create user");
                return;
            }

            toast.success("User created");
            setOpen(false);
            setEmail("");
            setPassword("");
            setVerify(true);
            setRole("user");
            onCreated();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v); }}>
            <DialogTrigger asChild>
                <Button className="bg-white hover:bg-gray-100 text-black">
                    <Plus size={16} className="mr-2" />
                    New User
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[85vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle>Create User</DialogTitle>
                    <DialogDescription>Create a Supabase Auth user and store role/active in users_info.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={saving} />
                    </div>

                    <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={saving} />
                        <p className="text-xs text-muted-foreground">Min 6 characters.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={saving}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">user</SelectItem>
                                <SelectItem value="admin">admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                            <Label>Verify email</Label>
                            <p className="text-xs text-muted-foreground">Set email as confirmed on creation.</p>
                        </div>
                        <Switch checked={verify} onCheckedChange={setVerify} disabled={saving} className="data-[state=checked]:bg-green-600" />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={submit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                        {saving ? "Creating..." : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditUserDialog({ user, onSaved }: { user: UserRow; onSaved: () => void }) {
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    const [role, setRole] = useState<Role>(user.role);
    const [active, setActive] = useState<boolean>(user.active);
    const [verify, setVerify] = useState<boolean>(user.verified);
    const [password, setPassword] = useState<string>("");

    // keep in sync if list refreshes
    useEffect(() => {
        setRole(user.role);
        setActive(user.active);
        setVerify(user.verified);
    }, [user.role, user.active, user.verified]);

    const submit = async () => {
        if (saving) return;

        setSaving(true);
        try {
            const res = await fetch("/api/user-management", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: user.id,
                    role,
                    active,
                    verify,
                    password: password ? password : undefined, // only send if set
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data?.error ?? "Failed to update user");
                return;
            }

            toast.success("User updated");
            setOpen(false);
            setPassword("");
            onSaved();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v); }}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                    <Pencil size={14} className="mr-2" />
                    Edit
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[85vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>Change role/active, verify, or reset password.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <Label>Email</Label>
                        <div className="text-sm font-medium">{user.email}</div>
                    </div>

                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={saving}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">user</SelectItem>
                                <SelectItem value="admin">admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                            <Label>Active</Label>
                            <p className="text-xs text-muted-foreground">Disable to prevent login when your app checks it.</p>
                        </div>
                        <Switch checked={active} onCheckedChange={setActive} disabled={saving} className="data-[state=checked]:bg-green-600" />
                    </div>

                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div className="space-y-0.5">
                            <Label>Verified</Label>
                            <p className="text-xs text-muted-foreground">Marks email as confirmed.</p>
                        </div>
                        <Switch checked={verify} onCheckedChange={setVerify} disabled={saving} className="data-[state=checked]:bg-green-600" />
                    </div>

                    <div className="space-y-2">
                        <Label>Reset Password (optional)</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={saving}
                            placeholder="Leave blank to keep password"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
                    <Button onClick={submit} disabled={saving} className="bg-green-600 hover:bg-green-700">
                        {saving ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}