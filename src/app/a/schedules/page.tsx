'use client'
import NewSidebar from "@/app/components/sidebar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type ScheduleProps = {
    id: string;
    title: string;
    date_start: string;
    date_end: string;
    slots: number;
    week: number[];
    enabled: boolean;
}

export default function Sidebar() {
    const [dataList, setDataList] = useState<ScheduleProps[]>();

    useEffect(() => {
        const fetchData = async () => {
            const res = await fetch("/api/schedules");

            const data = await res.json();
            if (res.status !== 200 || data.error) {
                return toast.error(data.error);
            }

            setDataList(data);
        }

        fetchData();
    }, []);

    return (
        <NewSidebar active="schedules">
            <div className="py-4">
                <div className="py-10 px-8 border-b flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Schedule</h1>
                        <p className="text-sm text-muted-foreground">
                            View and manage your schedules here.
                        </p>
                    </div>
                    <div>
                        <DialogForm />
                    </div>
                </div>
                <div className="mt-4 p-8">
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Your Schedules</h2>
                        <div className="space-y-2">
                            {
                                dataList && dataList.length > 0 ? (
                                    dataList.map((data) => (
                                        <CardList key={data.id} data={data} />
                                    ))
                                ) : (
                                    <Card className="border-s-8 border-s-green-600">
                                        <CardContent>
                                            <CardTitle className="text-base font-medium">
                                                No schedules yet
                                            </CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                You haven&apos;t created any schedules yet. Click the button above to get started.
                                            </p>
                                        </CardContent>
                                    </Card>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </NewSidebar>
    )
}

function CardList({ data }: { data: ScheduleProps }) {
    const [open, setOpen] = useState<boolean>(false);

    const copyLink = () => {
        navigator.clipboard.writeText(window.origin + "/schedule/" + data.id);
    }

    return (
        <Card
            key={data.id}
            className="border-s-8 border-s-green-600"
        >
            <CardContent className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-base font-medium">
                        {data.title}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                        <p>1hr Event</p>
                        <p>Weekdays, 8:30 AM - 9:30 AM, + 1 more</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Tooltip open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
                        <Button variant="ghost" size="sm" onClick={copyLink}>
                            <Link size={12} />
                        </Button>
                        <TooltipContent>
                            Copied!
                        </TooltipContent>
                    </Tooltip>

                    <div className="flex flex-col items-center">
                        <p className="text-xs text-muted-foreground mb-2">
                            Enabled
                        </p>
                        <Switch
                            size="default"
                            className="data-[state=checked]:bg-green-600"
                            checked={data.enabled}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function DialogForm() {
    const [open, setOpen] = useState<boolean>(false);
    const [disabledDays, setDisabledDays] = useState<number[]>([]);

    const toggleDays = (day: number, checked: boolean) => {
        setDisabledDays(prev => checked ? prev.filter((d) => d !== day) : prev.includes(day) ? prev : [...prev, day].sort((a, b) => a - b));
    }

    const submitHandler = async () => {

    }

    return (
        <Dialog open={open}>
            <Button variant="outline" size="lg" className="rounded-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white hover:border-white" onClick={() => setOpen(prev => !prev)}>
                <Plus size={16} />
                New Schedule
            </Button>
            <DialogContent>
                <DialogHeader className="border-b pb-2">
                    <DialogTitle>Add New Schedule</DialogTitle>
                    <DialogDescription>Fill up the required fields.</DialogDescription>
                </DialogHeader>
                <form className="max-h-[550px] overflow-y-auto space-y-4 p-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" type="text" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date_start">Date Start</Label>
                        <Calendar id="date_start" disabled={{ dayOfWeek: disabledDays }} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="date_end">Date End</Label>
                        <Calendar id="date_end" disabled={{ dayOfWeek: disabledDays }} />
                    </div>
                    <div className="space-y-2">
                        <Label>Select availability</Label>

                        <div className="flex flex-wrap justify-evenly items-center space-y-2">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                                <div key={day} className="flex items-center gap-2 px-2">
                                    <Checkbox id={day} checked={!disabledDays.includes(i)} onCheckedChange={(value) => toggleDays(i, value === true)} className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
                                    <label htmlFor={day} className="text-sm">{day}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="enabled">Enabled</Label>
                        <Switch id="enabled" required />
                    </div>
                </form>
                <DialogFooter className="border-t pt-2">
                    <Button variant={"secondary"}>
                        Cancel
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700">
                        Add Schedule
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}