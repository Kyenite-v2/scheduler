"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { CalendarClock, Check, Link2, LogOut, Users2 } from "lucide-react";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import Loading from "../loading";
import { useRouter } from "next/navigation";

export default function NewSidebar({
    children,
    active,
}: {
    children: ReactNode;
    active: string;
}) {
    const activeClass = "bg-green-600 text-white hover:bg-green-600 hover:text-white";

    const [isAdmin, setIsAdmin] = useState(false);
    const [loadingRole, setLoadingRole] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const res = await fetch("/api/role", { method: "GET", credentials: "include" });

                if (!res.ok) {
                    setIsAdmin(false);
                    return;
                }

                const data: { role?: string | null } = await res.json();
                setIsAdmin(data.role === "admin");
            } catch (err) {
                console.error("Failed to fetch role:", err);
                setIsAdmin(false);
            } finally {
                setLoadingRole(false);
            }
        };

        fetchRole();
    }, []);

    // Optional: avoid flicker until role is known
    // if (loadingRole) return null;
    if (loadingRole) return <Loading />

    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarHeader>
                    <div className="flex gap-2 py-4">
                        <Avatar className="flex items-center justify-center">
                            <AvatarImage src="/logo.png" />
                            <AvatarFallback>SC</AvatarFallback>
                        </Avatar>

                        <div className="text-lg text-green-600 font-medium flex items-center gap-2">
                            Scheduler
                            <Badge className="bg-green-600 text-white">
                                <Check size={12} />
                            </Badge>
                        </div>
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupLabel>General</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <Link href="/a/schedules">
                                    <SidebarMenuButton className={active === "schedules" ? activeClass : ""}>
                                        <Link2 size={16} />
                                        <span>Scheduling</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>

                            <SidebarMenuItem>
                                <Link href="/a/meetings">
                                    <SidebarMenuButton className={active === "meetings" ? activeClass : ""}>
                                        <CalendarClock size={16} />
                                        <span>Meetings</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>

                    {isAdmin && (
                        <SidebarGroup>
                            <SidebarGroupLabel>Administrative</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <Link href="/a/user_management">
                                        <SidebarMenuButton className={active === "user_management" ? activeClass : ""}>
                                            <Users2 size={16} />
                                            <span>User Management</span>
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>
                    )}
                </SidebarContent>

                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <LogoutButton />
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

            <SidebarInset>
                <div>{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );

    function LogoutButton() {
        const router = useRouter();

        const onLogout = async () => {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
            router.replace("/login");
            router.refresh(); // helps clear any cached server state
        };

        return (
            <SidebarMenuButton onClick={onLogout}>
                <LogOut size={16} />
                <span>Log out</span>
            </SidebarMenuButton>
        );
    }
}