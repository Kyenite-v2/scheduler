'use client'
import NewSidebar from "@/app/components/sidebar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent } from "@/components/ui/tooltip";
import { Link, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

type TimeProps = { start_time: string; end_time: string };
type FormDataProps = { title: string; date_start: Date | undefined; date_end: Date | undefined; disabledDays: number[]; enabled: boolean; time: TimeProps[] };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const today = () => stripTime(new Date());
const toMin = (hhmm: string) => { if (!/^\d{2}:\d{2}$/.test(hhmm)) return NaN; const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const rangesOverlap = (aS: number, aE: number, bS: number, bE: number) => aS < bE && bS < aE;

function DialogForm() {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<FormDataProps>({ title: "", date_start: undefined, date_end: undefined, disabledDays: [], enabled: true, time: [{ start_time: "08:00", end_time: "17:00" }] });

    const toggleDays = (day: number, checked: boolean) => setFormData(prev => { const next = new Set(prev.disabledDays); checked ? next.delete(day) : next.add(day); return { ...prev, disabledDays: Array.from(next).sort((a, b) => a - b) }; });

    const addTimeRow = () => setFormData(prev => ({ ...prev, time: [...prev.time, { start_time: "", end_time: "" }] }));
    const removeTimeRow = (idx: number) => setFormData(prev => { const next = prev.time.filter((_, i) => i !== idx); return { ...prev, time: next.length ? next : [{ start_time: "", end_time: "" }] }; });

    const updateTimeRow = (idx: number, key: keyof TimeProps, value: string) => {
        setFormData(prev => {
            const next = prev.time.map((row, i) => i === idx ? { ...row, [key]: value } : row);
            const cur = next[idx];
            const s = toMin(cur.start_time), e = toMin(cur.end_time);

            if (!Number.isNaN(s) && !Number.isNaN(e) && s >= e) {
                toast.error("Start time must be before end time.");
                return prev;
            }

            if (!Number.isNaN(s) && !Number.isNaN(e)) {
                for (let i = 0; i < next.length; i++) {
                    if (i === idx) continue;
                    const os = toMin(next[i].start_time), oe = toMin(next[i].end_time);
                    if (Number.isNaN(os) || Number.isNaN(oe)) continue;
                    if (rangesOverlap(s, e, os, oe)) {
                        toast.error("Time overlaps with another selected range.");
                        return prev;
                    }
                }
            }

            return { ...prev, time: next };
        });
    };

    const resetForm = () => setFormData({ title: "", date_start: undefined, date_end: undefined, disabledDays: [], enabled: true, time: [{ start_time: "08:00", end_time: "17:00" }] });

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const title = formData.title.trim();
        if (!title) return toast.error("Title is required.");
        if (!formData.date_start) return toast.error("Date Start is required.");
        if (!formData.date_end) return toast.error("Date End is required.");

        const start = stripTime(formData.date_start), end = stripTime(formData.date_end), minToday = today();
        if (start < minToday) return toast.error("Date Start cannot be in the past.");
        if (end < start) return toast.error("Date End must be on/after Date Start.");

        if (!formData.time.length) return toast.error("Add at least one time range.");
        for (const [i, t] of formData.time.entries()) {
            const s = toMin(t.start_time), e2 = toMin(t.end_time);
            if (Number.isNaN(s) || Number.isNaN(e2) || s >= e2) return toast.error(`Time row #${i + 1} is invalid.`);
        }

        const sorted = formData.time.map(t => ({ s: toMin(t.start_time), e: toMin(t.end_time) })).sort((a, b) => a.s - b.s);
        for (let i = 0; i < sorted.length - 1; i++) if (rangesOverlap(sorted[i].s, sorted[i].e, sorted[i + 1].s, sorted[i + 1].e)) return toast.error("Time ranges overlap.");

        const payload = { title, date_start: start.toISOString(), date_end: end.toISOString(), disabledDays: formData.disabledDays, enabled: formData.enabled, time: formData.time, availableDays: [0, 1, 2, 3, 4, 5, 6].filter(d => !formData.disabledDays.includes(d)) };

        try {
            setSubmitting(true);
            const res = await fetch("/api/schedules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (!res.ok) { const msg = await res.text().catch(() => ""); throw new Error(msg || "Request failed"); }
            toast.success("Schedule added!");
            setOpen(false);
            resetForm();
        } catch (err) {
            console.error(err);
            toast.error("Failed to add schedule.");
        } finally {
            setSubmitting(false);
        }
    };

    const disabledStart = useMemo(() => ({ dayOfWeek: formData.disabledDays, before: today() }), [formData.disabledDays]);
    const disabledEnd = useMemo(() => !formData.date_start ? true : ({ dayOfWeek: formData.disabledDays, before: stripTime(formData.date_start) }), [formData.disabledDays, formData.date_start]);

    return (
        <>
            <Button variant="outline" size="lg" className="rounded-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white hover:border-white" onClick={() => setOpen(true)}><Plus size={16} />New Schedule</Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader className="border-b pb-2">
                        <DialogTitle>Add New Schedule</DialogTitle>
                        <DialogDescription>Fill up the required fields.</DialogDescription>
                    </DialogHeader>

                    <form className="max-h-137 overflow-y-auto space-y-4 p-4" onSubmit={submitHandler}>
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" type="text" required value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date_start">Date Start</Label>
                            <Calendar mode="single" selected={formData.date_start} onSelect={date => setFormData(p => ({ ...p, date_start: date ?? undefined, date_end: (p.date_end && date && stripTime(p.date_end) < stripTime(date)) ? undefined : p.date_end }))} disabled={disabledStart} />
                            <p className="text-xs text-muted-foreground">Past dates are disabled.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date_end">Date End</Label>
                            <div className={!formData.date_start ? "pointer-events-none opacity-60" : ""}>
                                <Calendar mode="single" selected={formData.date_end} onSelect={date => setFormData(p => ({ ...p, date_end: date ?? undefined }))} disabled={disabledEnd} />
                            </div>
                            {!formData.date_start ? <p className="text-xs text-muted-foreground">Select Date Start first to enable Date End.</p> : null}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Time availability</Label>
                                <Button type="button" variant="secondary" size="sm" onClick={addTimeRow}><Plus className="mr-1" size={14} />Add time</Button>
                            </div>

                            <div className="space-y-2">
                                {formData.time.map((t, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:items-end">
                                        <div className="flex-1">
                                            <Label className="text-xs">Start</Label>
                                            <Input type="time" value={t.start_time} onChange={e => updateTimeRow(idx, "start_time", e.target.value)} />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs">End</Label>
                                            <Input type="time" value={t.end_time} onChange={e => updateTimeRow(idx, "end_time", e.target.value)} />
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => removeTimeRow(idx)} aria-label="Remove time row"><Trash2 size={16} /></Button>
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-muted-foreground">Overlapping time ranges are blocked.</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Select availability</Label>
                            <div className="flex flex-wrap justify-evenly items-center gap-y-2">
                                {DAYS.map((day, i) => (
                                    <div key={day} className="flex items-center gap-2 px-2">
                                        <Checkbox id={day} checked={!formData.disabledDays.includes(i)} onCheckedChange={value => toggleDays(i, value === true)} className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
                                        <label htmlFor={day} className="text-sm">{day}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-md border p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="enabled">Enabled</Label>
                                <p className="text-xs text-muted-foreground">Disable to hide schedule temporarily.</p>
                            </div>
                            <Switch id="enabled" checked={formData.enabled} onCheckedChange={v => setFormData(p => ({ ...p, enabled: v }))} />
                        </div>

                        <DialogFooter className="border-t pt-2">
                            <Button type="button" variant="secondary" onClick={() => { setOpen(false); resetForm(); }} disabled={submitting}>Cancel</Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting}>{submitting ? "Adding..." : "Add Schedule"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}