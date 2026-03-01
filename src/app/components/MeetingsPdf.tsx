"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type ScheduleOption = {
    id: string;
    title: string;
    date_start: string;
    date_end: string;
    enabled: boolean;
};

type AppointmentRow = {
    id: number;
    name: string;
    email: string;
    created_at: string;
};

type TimeBucket = {
    time_id: number;
    start_time: string;
    end_time: string;
    appointments: AppointmentRow[];
};

type DayGroup = {
    date: string;
    times: TimeBucket[];
};

const styles = StyleSheet.create({
    page: { padding: 24, fontSize: 11, fontFamily: "Helvetica" },
    header: { marginBottom: 12 },
    title: { fontSize: 16, fontWeight: "bold" },
    subtitle: { marginTop: 4, color: "#444" },

    section: { marginTop: 12 },
    dayTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 6 },

    card: { borderWidth: 1, borderColor: "#e5e5e5", borderRadius: 6, padding: 8, marginBottom: 8 },
    row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
    timeLabel: { fontSize: 11, fontWeight: "bold" },

    appt: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#eee" },
    small: { fontSize: 10, color: "#555" },
});

function formatTime(t: string) {
    const [hh, mm] = t.split(":");
    const h = Number(hh);
    const m = Number(mm);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function MeetingsPdf({
    selectedSchedule,
    mode,
    groups,
}: {
    selectedSchedule: ScheduleOption;
    mode: "upcoming" | "all";
    groups: DayGroup[];
}) {
    const now = new Date().toLocaleString();

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.title}>Meetings / Appointments Report</Text>
                    <Text style={styles.subtitle}>Generated: {now}</Text>
                    <Text style={styles.subtitle}>Schedule: {selectedSchedule.title}</Text>
                    <Text style={styles.subtitle}>
                        Range: {selectedSchedule.date_start} → {selectedSchedule.date_end} • Mode: {mode}
                    </Text>
                    <Text style={styles.subtitle}>Status: {selectedSchedule.enabled ? "Enabled" : "Disabled"}</Text>
                </View>

                {groups.length === 0 ? (
                    <Text>No appointments found for this view.</Text>
                ) : (
                    groups.map((g) => (
                        <View key={g.date} style={styles.section}>
                            <Text style={styles.dayTitle}>Date: {g.date}</Text>

                            {g.times.map((t) => {
                                const label = `${formatTime(t.start_time)} - ${formatTime(t.end_time)}`;
                                const count = t.appointments.length;

                                return (
                                    <View key={`${g.date}-${t.time_id}`} style={styles.card}>
                                        <View style={styles.row}>
                                            <Text style={styles.timeLabel}>{label}</Text>
                                            <Text>{count} booked</Text>
                                        </View>

                                        {count === 0 ? (
                                            <Text style={styles.small}>No appointments for this time slot.</Text>
                                        ) : (
                                            t.appointments.map((a) => (
                                                <View key={a.id} style={styles.appt}>
                                                    <Text>{a.name}</Text>
                                                    <Text style={styles.small}>{a.email}</Text>
                                                    <Text style={styles.small}>
                                                        Booked at: {new Date(a.created_at).toLocaleString()}
                                                    </Text>
                                                </View>
                                            ))
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ))
                )}
            </Page>
        </Document>
    );
}