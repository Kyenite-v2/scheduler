import NewSidebar from "@/app/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, Plus } from "lucide-react";

export default function Sidebar() {
    return (
        <NewSidebar>
            <div className="py-4">
                <div className="py-10 px-8 border-b flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Schedule</h1>
                        <p className="text-sm text-muted-foreground">
                            View and manage your schedules here.
                        </p>
                    </div>
                    <div>
                        <Button variant="outline" size="lg" className="rounded-full border-green-600 text-green-600">
                            <Plus size={16} />
                            New Schedule
                        </Button>
                    </div>
                </div>
                <div className="mt-4 p-8">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Your Schedules</h2>
                        <div className="space-y-2">
                            <Card className="border-s-8 border-s-green-600">
                                <CardContent>
                                    <CardTitle className="text-base font-medium">No schedules yet</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        You haven&apos;t created any schedules yet. Click the button above to get started.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="border-s-8 border-s-green-600">
                                <CardContent className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-medium">Entrance Exam</CardTitle>
                                        <div className="text-sm text-muted-foreground">
                                            <p>
                                                1hr Event
                                            </p>
                                            <p>
                                                Weekdays, 8:30 AM - 9:30 AM, + 1 more
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger popoverTargetAction="toggle" asChild>
                                                <Button variant={"ghost"} size={"sm"}>
                                                    <Link size={12} />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                Copied!
                                            </TooltipContent>
                                        </Tooltip>
                                        <div className="flex flex-col items-center">
                                            <p className="text-xs text-muted-foreground mb-2">Enabled</p>
                                            <Switch size="default" className="data-[state=checked]:bg-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </NewSidebar>
    )
}