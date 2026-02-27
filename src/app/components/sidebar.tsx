import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from "@/components/ui/sidebar";
import { CalendarClock, Check, Link2, LogOut, Users2 } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

export default function NewSidebar({ children, active }: { children: ReactNode, active: string }) {
    const activeClass = "bg-green-600 text-white hover:bg-green-600 hover:text-white";

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
                                <Link href="/a/schedules">
                                    <SidebarMenuButton className={active === "meetings" ? activeClass : ""}>
                                        <CalendarClock size={16} />
                                        <span>Meetings</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>

                    <SidebarGroup>
                        <SidebarGroupLabel>Administrative</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <Link href="/a/schedules">
                                    <SidebarMenuButton className={active === "user_management" ? activeClass : ""}>
                                        <Users2 size={16} />
                                        <span>User Management</span>
                                    </SidebarMenuButton>
                                </Link>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <Link href="/api/auth/logout">
                                <SidebarMenuButton>
                                    <LogOut size={16} />
                                    <span>Log out</span>
                                </SidebarMenuButton>
                            </Link>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <div>
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}