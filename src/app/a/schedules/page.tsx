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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";

/* =======================
   Types
======================= */

type TimeDbRow = { id: number; start_time: string; end_time: string };

type ScheduleProps = {
    id: string;
    title: string;
    date_start: string; // "YYYY-MM-DD"
    date_end: string;   // "YYYY-MM-DD"
    slots: number;
    week: number[];     // ✅ disabled day indexes
    enabled: boolean;
    time: TimeDbRow[];  // ✅ from GET join
};

/* =======================
   Helpers
======================= */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function formatTime(t: string) {
    const [hh, mm] = t.split(":");
    const h = Number(hh);
    const m = Number(mm);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function timesSummary(times: { start_time: string; end_time: string }[]) {
    if (!times || times.length === 0) return "No time set";
    const first = `${formatTime(times[0].start_time)} - ${formatTime(times[0].end_time)}`;
    const more = times.length - 1;
    return more > 0 ? `${first}, +${more} more` : first;
}

function daysSummaryFromDisabled(disabled: number[]) {
    const dis = (disabled ?? []).slice().sort((a, b) => a - b);
    const available = [0, 1, 2, 3, 4, 5, 6].filter((d) => !dis.includes(d));

    if (available.length === 7) return "Everyday";
    if (available.join(",") === "1,2,3,4,5") return "Weekdays";
    if (available.join(",") === "0,6") return "Weekends";
    return available.map((d) => DAYS[d]).join(", ");
}

const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const today = () => stripTime(new Date());

const toMin = (hhmm: string) => {
    if (!/^\d{2}:\d{2}$/.test(hhmm)) return NaN;
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};

const rangesOverlap = (aS: number, aE: number, bS: number, bE: number) => aS < bE && bS < aE;

/* =======================
   Page
======================= */

export default function Sidebar() {
    const [dataList, setDataList] = useState<ScheduleProps[]>();
    const [loadingList, setLoadingList] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingList(true);
                const res = await fetch("/api/schedules");
                const data = await res.json();

                if (!res.ok || data?.error) {
                    toast.error(data?.error ?? "Failed to load schedules");
                    setDataList([]);
                    return;
                }

                setDataList(data);
            } finally {
                setLoadingList(false);
            }
        };

        fetchData();
    }, []);

    return (
        <NewSidebar active="schedules">
            <div>
                <div className="pt-8 bg-green-600 py-10 px-8 border-b flex items-center justify-between gap-4 shadow">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="md:hidden" />
                        <div>
                            <h1 className="text-2xl font-bold text-white">Schedule</h1>
                            <p className="text-sm text-gray-50">View and manage your schedules here.</p>
                        </div>
                    </div>
                    <div>
                        <DialogForm
                            onCreated={(created) => {
                                setDataList((prev) => [created, ...(prev ?? [])]);
                            }}
                        />
                    </div>
                </div>

                <div className="mt-4 p-8">
                    <h2 className="text-green-600 text-xl font-semibold mb-2">Your Schedules</h2>

                    <div className="space-y-2">
                        {loadingList ? (
                            <SchedulesSkeleton />
                        ) : dataList && dataList.length > 0 ? (
                            dataList.map((data) => (
                                <CardList
                                    key={data.id}
                                    data={data}
                                    onUpdated={(next) =>
                                        setDataList((prev) => (prev ?? []).map((x) => (x.id === next.id ? next : x)))
                                    }
                                    onDeleted={(id) =>
                                        setDataList((prev) => (prev ?? []).filter((x) => x.id !== id))
                                    }
                                />
                            ))
                        ) : (
                            <Card className="border-s-8 border-s-green-600">
                                <CardContent>
                                    <CardTitle className="text-base font-medium">No schedules yet</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        You haven&apos;t created any schedules yet. Click the button above to get started.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </NewSidebar>
    );

    function SchedulesSkeleton() {
        return (
            <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-5 w-48" />
                                <Skeleton className="h-4 w-80 max-w-full" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-9 w-9 rounded-md" />
                                <Skeleton className="h-9 w-14 rounded-md" />
                                <Skeleton className="h-9 w-16 rounded-md" />
                                <Skeleton className="h-10 w-28 rounded-md" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
}

/* =======================
   CardList (with Edit + Delete)
======================= */

function CardList({
    data,
    onUpdated,
    onDeleted,
}: {
    data: ScheduleProps;
    onUpdated: (next: ScheduleProps) => void;
    onDeleted: (id: string) => void;
}) {
    const [enabled, setEnabled] = useState(data.enabled);
    const [openCopy, setOpenCopy] = useState(false);
    const [loading, setLoading] = useState(false);

    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const [edit, setEdit] = useState(() => ({
        title: data.title,
        date_start: data.date_start, // YYYY-MM-DD
        date_end: data.date_end,
        disabledDays: data.week ?? [],
        slots: String(data.slots),
        enabled: data.enabled,
        time: (data.time ?? []).map((t) => ({
            start_time: t.start_time.slice(0, 5),
            end_time: t.end_time.slice(0, 5),
        })),
    }));

    useEffect(() => {
        setEnabled(data.enabled);
        setEdit({
            title: data.title,
            date_start: data.date_start,
            date_end: data.date_end,
            disabledDays: data.week ?? [],
            slots: String(data.slots),
            enabled: data.enabled,
            time: (data.time ?? []).map((t) => ({
                start_time: t.start_time.slice(0, 5),
                end_time: t.end_time.slice(0, 5),
            })),
        });
    }, [data]);

    const copyLink = async () => {
        await navigator.clipboard.writeText(`${window.location.origin}/schedule/${data.id}`);
        setOpenCopy(true);
        setTimeout(() => setOpenCopy(false), 1200);
    };

    const toggleHandler = async (id: string, nextEnabled: boolean) => {
        if (loading) return;

        const prev = enabled;
        setEnabled(nextEnabled);
        setLoading(true);

        try {
            const res = await fetch("/api/schedules", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, enabled: nextEnabled }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(json?.error ?? "There seems to be a problem. Please try again later.");
                setEnabled(prev);
                return;
            }

            if (json?.data) onUpdated(json.data);
            toast.success("Updated successfully!");
        } catch {
            toast.error("Network error.");
            setEnabled(prev);
        } finally {
            setLoading(false);
        }
    };

    const addTimeRow = () => setEdit((p) => ({ ...p, time: [...p.time, { start_time: "", end_time: "" }] }));

    const removeTimeRow = (idx: number) =>
        setEdit((p) => {
            const next = p.time.filter((_, i) => i !== idx);
            return { ...p, time: next.length ? next : [{ start_time: "", end_time: "" }] };
        });

    const saveEdit = async () => {
        if (loading) return;

        const title = edit.title.trim();
        if (!title) return toast.error("Title is required.");
        if (!edit.date_start || !edit.date_end) return toast.error("Date start/end required.");
        if (edit.date_end < edit.date_start) return toast.error("date_end must be on/after date_start");

        const slots = parseInt(edit.slots, 10);
        if (!Number.isFinite(slots) || slots <= 0 || slots > 32767) return toast.error("Slots must be 1..32767");

        if (!edit.time.length) return toast.error("Add at least one time range.");
        for (const [i, t] of edit.time.entries()) {
            if (!t.start_time || !t.end_time) return toast.error(`Time row #${i + 1} is incomplete.`);
            if (t.start_time >= t.end_time) return toast.error(`Time row #${i + 1} is invalid.`);
        }

        const sorted = edit.time
            .map((t) => ({ s: toMin(t.start_time), e: toMin(t.end_time) }))
            .sort((a, b) => a.s - b.s);

        for (let i = 0; i < sorted.length - 1; i++) {
            if (rangesOverlap(sorted[i].s, sorted[i].e, sorted[i + 1].s, sorted[i + 1].e)) {
                return toast.error("Time ranges overlap.");
            }
        }

        setLoading(true);
        try {
            const res = await fetch("/api/schedules", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: data.id,
                    title,
                    date_start: edit.date_start,
                    date_end: edit.date_end,
                    disabledDays: edit.disabledDays, // ✅ saved into week array
                    slots,
                    enabled: edit.enabled,
                    time: edit.time.map((t) => ({ start_time: t.start_time, end_time: t.end_time })),
                }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) return toast.error(json?.error ?? "Failed to update.");

            if (json?.data) onUpdated(json.data);
            setEditOpen(false);
            toast.success("Schedule updated!");
        } catch {
            toast.error("Network error.");
        } finally {
            setLoading(false);
        }
    };

    const deleteSchedule = async () => {
        if (loading) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/schedules`, { method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ id: data.id }) });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) return toast.error(json?.error ?? "Failed to delete.");

            onDeleted(data.id);
            setDeleteOpen(false);
            toast.success("Deleted!");
        } catch {
            toast.error("Network error.");
        } finally {
            setLoading(false);
        }
    };

    const subline = `${daysSummaryFromDisabled(data.week)} • ${timesSummary(data.time ?? [])}`;

    return (
        <Card className="border-s-8 border-s-green-600">
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <CardTitle className="text-base font-medium truncate">{data.title}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                        <p className="truncate">{subline}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                    <TooltipProvider>
                        <Tooltip open={openCopy}>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={copyLink} disabled={loading}>
                                    <Link size={12} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Copied!</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)} disabled={loading}>
                        Edit
                    </Button>

                    <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} disabled={loading}>
                        Delete
                    </Button>

                    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <p className="text-xs text-muted-foreground">Enabled</p>
                        <Switch
                            className="data-[state=checked]:bg-green-600"
                            checked={enabled}
                            disabled={loading}
                            onCheckedChange={(value) => toggleHandler(data.id, value)}
                        />
                    </div>
                </div>
            </CardContent>

            {/* EDIT */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-h-[85vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Schedule</DialogTitle>
                        <DialogDescription>Update schedule details and time ranges.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={edit.title} onChange={(e) => setEdit((p) => ({ ...p, title: e.target.value }))} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Date Start</Label>
                                <Input type="date" value={edit.date_start} onChange={(e) => setEdit((p) => ({ ...p, date_start: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label>Date End</Label>
                                <Input type="date" value={edit.date_end} onChange={(e) => setEdit((p) => ({ ...p, date_end: e.target.value }))} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Select availability</Label>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {DAYS.map((day, i) => (
                                    <div key={day} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`${data.id}-edit-${day}`}
                                            checked={!edit.disabledDays.includes(i)}
                                            onCheckedChange={(v) => {
                                                const checked = v === true;
                                                setEdit((p) => {
                                                    const next = new Set(p.disabledDays);
                                                    checked ? next.delete(i) : next.add(i);
                                                    return { ...p, disabledDays: Array.from(next).sort((a, b) => a - b) };
                                                });
                                            }}
                                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                        />
                                        <label htmlFor={`${data.id}-edit-${day}`} className="text-sm">{day}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Slots per day</Label>
                            <Input
                                type="number"
                                min={1}
                                max={32767}
                                value={edit.slots}
                                onChange={(e) => setEdit((p) => ({ ...p, slots: e.target.value }))}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-md border p-3">
                            <div>
                                <Label>Enabled</Label>
                                <p className="text-xs text-muted-foreground">Disable to hide schedule temporarily.</p>
                            </div>
                            <Switch checked={edit.enabled} onCheckedChange={(v) => setEdit((p) => ({ ...p, enabled: v }))} />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Time ranges</Label>
                                <Button type="button" variant="secondary" size="sm" onClick={addTimeRow}>
                                    <Plus size={14} className="mr-1" />
                                    Add
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {edit.time.map((t, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:items-end">
                                        <div className="flex-1">
                                            <Label className="text-xs">Start</Label>
                                            <Input
                                                type="time"
                                                value={t.start_time}
                                                onChange={(e) => setEdit((p) => ({
                                                    ...p,
                                                    time: p.time.map((r, i) => (i === idx ? { ...r, start_time: e.target.value } : r)),
                                                }))}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs">End</Label>
                                            <Input
                                                type="time"
                                                value={t.end_time}
                                                onChange={(e) => setEdit((p) => ({
                                                    ...p,
                                                    time: p.time.map((r, i) => (i === idx ? { ...r, end_time: e.target.value } : r)),
                                                }))}
                                            />
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="text-red-600" onClick={() => removeTimeRow(idx)}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-2">
                        <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700" onClick={saveEdit} disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete schedule?</DialogTitle>
                        <DialogDescription>This will remove the schedule and its time ranges permanently.</DialogDescription>
                    </DialogHeader>

                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={deleteSchedule} disabled={loading}>
                            {loading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

/* =======================
   DialogForm (Create)
   - same as your original, but returns created item to parent
======================= */

type TimeProps = { start_time: string; end_time: string };
type FormDataProps = {
    title: string;
    date_start: Date | undefined;
    date_end: Date | undefined;
    disabledDays: number[];
    slots: string;
    enabled: boolean;
    time: TimeProps[];
};

export function DialogForm({ onCreated }: { onCreated: (created: ScheduleProps) => void }) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [endMonth, setEndMonth] = useState<Date>(new Date());

    const [formData, setFormData] = useState<FormDataProps>({
        title: "",
        date_start: undefined,
        date_end: undefined,
        disabledDays: [],
        slots: "20",
        enabled: true,
        time: [{ start_time: "08:00", end_time: "17:00" }],
    });

    const toggleDays = (day: number, checked: boolean) =>
        setFormData((prev) => {
            const next = new Set(prev.disabledDays);
            checked ? next.delete(day) : next.add(day);
            return { ...prev, disabledDays: Array.from(next).sort((a, b) => a - b) };
        });

    const addTimeRow = () =>
        setFormData((prev) => ({ ...prev, time: [...prev.time, { start_time: "", end_time: "" }] }));

    const removeTimeRow = (idx: number) =>
        setFormData((prev) => {
            const next = prev.time.filter((_, i) => i !== idx);
            return { ...prev, time: next.length ? next : [{ start_time: "", end_time: "" }] };
        });

    const updateTimeRow = (idx: number, key: keyof TimeProps, value: string) => {
        setFormData((prev) => {
            const next = prev.time.map((row, i) => (i === idx ? { ...row, [key]: value } : row));
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

    const resetForm = () =>
        setFormData({
            title: "",
            date_start: undefined,
            date_end: undefined,
            disabledDays: [],
            slots: "20",
            enabled: true,
            time: [{ start_time: "08:00", end_time: "17:00" }],
        });

    const submitHandler = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;

        const title = formData.title.trim();
        if (!title) return toast.error("Title is required.");
        if (!formData.date_start) return toast.error("Date Start is required.");
        if (!formData.date_end) return toast.error("Date End is required.");

        const start = stripTime(formData.date_start);
        const end = stripTime(formData.date_end);
        const minToday = today();

        if (start < minToday) return toast.error("Date Start cannot be in the past.");
        if (end < start) return toast.error("Date End must be on/after Date Start.");

        const slots = parseInt(formData.slots, 10);
        if (!Number.isFinite(slots) || slots <= 0 || slots > 32767) {
            return toast.error("Slots must be between 1 and 32767.");
        }

        if (!formData.time.length) return toast.error("Add at least one time range.");

        for (const [i, t] of formData.time.entries()) {
            const s = toMin(t.start_time), e2 = toMin(t.end_time);
            if (Number.isNaN(s) || Number.isNaN(e2) || s >= e2) {
                return toast.error(`Time row #${i + 1} is invalid.`);
            }
        }

        const sorted = formData.time
            .map((t) => ({ s: toMin(t.start_time), e: toMin(t.end_time) }))
            .sort((a, b) => a.s - b.s);

        for (let i = 0; i < sorted.length - 1; i++) {
            if (rangesOverlap(sorted[i].s, sorted[i].e, sorted[i + 1].s, sorted[i + 1].e)) {
                return toast.error("Time ranges overlap.");
            }
        }

        const payload = {
            title,
            date_start: start.toISOString(),
            date_end: end.toISOString(),
            disabledDays: formData.disabledDays, // ✅ week array
            enabled: formData.enabled,
            slots,
            time: formData.time,
        };

        try {
            setSubmitting(true);

            const res = await fetch("/api/schedules", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok) {
                toast.error(json?.error ?? "Failed to add schedule.");
                return;
            }

            // ✅ route returns created full data with time
            if (json?.data) onCreated(json.data);

            toast.success("Schedule added!");
            setOpen(false);
            resetForm();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message ?? "Failed to add schedule.");
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        if (formData.date_start) setEndMonth(formData.date_start);
    }, [formData.date_start]);

    const disabledStart = [{ dayOfWeek: formData.disabledDays }, { before: today() }];
    const disabledEnd = [{ dayOfWeek: formData.disabledDays }, { before: formData.date_start ? stripTime(formData.date_start) : today() }];

    return (
        <>
            <Button
                variant="outline"
                size="lg"
                className="rounded-full border-green-600 text-green-600 hover:bg-gray-100 hover:text-green-700 hover:border-white"
                onClick={() => setOpen(true)}
            >
                <Plus size={16} />
                New Schedule
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader className="border-b pb-2">
                        <DialogTitle>Add New Schedule</DialogTitle>
                        <DialogDescription>Fill up the required fields.</DialogDescription>
                    </DialogHeader>

                    <form className="max-h-137 overflow-y-auto space-y-4 p-4" onSubmit={submitHandler}>
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" type="text" required value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date_start">Date Start</Label>
                            <Calendar
                                mode="single"
                                selected={formData.date_start}
                                onSelect={(date) =>
                                    setFormData((p) => ({
                                        ...p,
                                        date_start: date ?? undefined,
                                        date_end: p.date_end && date && stripTime(p.date_end) < stripTime(date) ? undefined : p.date_end,
                                    }))
                                }
                                disabled={disabledStart}
                            />
                            <p className="text-xs text-muted-foreground">Past dates are disabled.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date_end">Date End</Label>
                            <div className={!formData.date_start ? "pointer-events-none opacity-60" : ""}>
                                <Calendar
                                    mode="single"
                                    selected={formData.date_end}
                                    month={endMonth}
                                    onMonthChange={(e) => setEndMonth(e)}
                                    onSelect={(date) => setFormData((p) => ({ ...p, date_end: date ?? undefined }))}
                                    disabled={disabledEnd}
                                />
                            </div>
                            {!formData.date_start ? <p className="text-xs text-muted-foreground">Select Date Start first.</p> : null}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Time availability</Label>
                                <Button type="button" variant="secondary" size="sm" onClick={addTimeRow}>
                                    <Plus className="mr-1" size={14} />
                                    Add time
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {formData.time.map((t, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-2 sm:items-end">
                                        <div className="flex-1">
                                            <Label className="text-xs">Start</Label>
                                            <Input type="time" value={t.start_time} onChange={(e) => updateTimeRow(idx, "start_time", e.target.value)} />
                                        </div>
                                        <div className="flex-1">
                                            <Label className="text-xs">End</Label>
                                            <Input type="time" value={t.end_time} onChange={(e) => updateTimeRow(idx, "end_time", e.target.value)} />
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => removeTimeRow(idx)} aria-label="Remove time row">
                                            <Trash2 size={16} />
                                        </Button>
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
                                        <Checkbox id={day} checked={!formData.disabledDays.includes(i)} onCheckedChange={(value) => toggleDays(i, value === true)} className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
                                        <label htmlFor={day} className="text-sm">{day}</label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slots">Slots per day</Label>
                            <Input id="slots" type="number" min={1} max={32767} required value={formData.slots} onChange={(e) => setFormData((p) => ({ ...p, slots: e.target.value }))} />
                        </div>

                        <div className="flex items-center justify-between rounded-md border p-3">
                            <div className="space-y-0.5">
                                <Label htmlFor="enabled">Enabled</Label>
                                <p className="text-xs text-muted-foreground">Disable to hide schedule temporarily.</p>
                            </div>
                            <Switch id="enabled" checked={formData.enabled} onCheckedChange={(v) => setFormData((p) => ({ ...p, enabled: v }))} />
                        </div>

                        <DialogFooter className="border-t pt-2">
                            <Button type="button" variant="secondary" onClick={() => { setOpen(false); resetForm(); }} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={submitting}>
                                {submitting ? "Adding..." : "Add Schedule"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}