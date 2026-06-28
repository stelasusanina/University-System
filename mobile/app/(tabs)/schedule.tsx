import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { scheduleStyles as styles } from "@/styles/schedule";
import type { StudentProgram, CourseWithSchedule, ScheduleEntry } from "@shared/types/schedule";
import { LESSON_TYPE_LABELS } from "@shared/types/schedule";
import { ROLE_LABELS } from "@shared/types/auth";

const DAYS = [
  { key: "ПОНЕДЕЛНИК", short: "Пон" },
  { key: "ВТОРНИК", short: "Вт" },
  { key: "СРЯДА", short: "Ср" },
  { key: "ЧЕТВЪРТЪК", short: "Чет" },
  { key: "ПЕТЪК", short: "Пет" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

function getCurrentDayKey(): DayKey {
  const jsDay = new Date().getDay();
  const map: Record<number, DayKey> = {
    1: "ПОНЕДЕЛНИК",
    2: "ВТОРНИК",
    3: "СРЯДА",
    4: "ЧЕТВЪРТЪК",
    5: "ПЕТЪК",
  };
  return map[jsDay] ?? "ПОНЕДЕЛНИК";
}

interface DayEntry {
  course: CourseWithSchedule;
  schedule: ScheduleEntry;
}

export default function ScheduleScreen() {
  const [program, setProgram] = useState<StudentProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayKey>(getCurrentDayKey());
  const [refreshing, setRefreshing] = useState(false);

  function loadProgram() {
    api
      .get<StudentProgram>("/student/program")
      .then((res) => {
        setProgram(res);
        setError(null);
      })
      .catch(() => {
        setError("Неуспешно зареждане на програмата. Опитайте отново.");
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    loadProgram();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    loadProgram();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Зареждане на програмата...</Text>
      </View>
    );
  }

  if (error || !program) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error ?? "Няма данни за програмата."}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadProgram(); }}>
          <Text style={styles.retryBtnText}>Опитай отново</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const entriesForDay: DayEntry[] = program.courses
    .flatMap((course) =>
      course.schedules
        .filter((s) => s.dayOfWeek === selectedDay)
        .map((schedule) => ({ course, schedule }))
    )
    .sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime));

  const hasDayEntries = (dayKey: string) =>
    program.courses.some((c) => c.schedules.some((s) => s.dayOfWeek === dayKey));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Програма</Text>
        <Text style={styles.subtitle}>
          {program.student.specialty} · {program.student.year} курс
          {program.student.group != null ? ` · Група ${program.student.group}` : ""}
        </Text>
      </View>

      <View style={styles.semesterBadge}>
        <Ionicons name="calendar-outline" size={14} color="#1e3a8a" />
        <Text style={styles.semesterText}>
          {program.semester.name}
        </Text>
      </View>

      <View style={styles.dayTabs}>
        {DAYS.map((day) => {
          const isActive = selectedDay === day.key;
          const hasEntries = hasDayEntries(day.key);
          return (
            <TouchableOpacity
              key={day.key}
              style={[styles.dayTab, isActive && styles.dayTabActive]}
              onPress={() => setSelectedDay(day.key)}
            >
              <Text style={[styles.dayTabLabel, isActive && styles.dayTabLabelActive]}>
                {day.short}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {entriesForDay.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="sunny-outline" size={40} color="#cbd5e1" />
          <Text style={styles.emptyText}>Няма часове в този ден</Text>
        </View>
      ) : (
        entriesForDay.map(({ course, schedule }) => {
          return (
            <View key={schedule.id} style={[styles.card]}>
              <View style={styles.cardHeader}>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={13} color="#64748b" />
                  <Text style={styles.timeText}>
                    {schedule.startTime} – {schedule.endTime}
                  </Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: "#f1f5f9" }]}>
                  <Text style={[styles.typeBadgeText, { color: "#64748b" }]}>
                    {LESSON_TYPE_LABELS[schedule.type] ?? schedule.type}
                  </Text>
                </View>
              </View>

              <Text style={styles.courseName}>{course.name}</Text>

              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={13} color="#94a3b8" />
                <Text style={styles.metaText}>
                  {ROLE_LABELS[course.lecturer.role] ?? course.lecturer.role} {course.lecturer.firstName} {course.lecturer.lastName}
                </Text>
              </View>

              <View style={styles.locationRow}>
                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => {
                      const { latitude, longitude, name } = schedule.building!;
                      if (latitude == null || longitude == null) return;
                      const url = `https://maps.google.com/maps?q=${encodeURIComponent(name)}@${latitude},${longitude}`;
                      Linking.openURL(url).catch(() => {});
                    }}
                  >
                    <Ionicons name="location-outline" size={13} color="#94a3b8" />
                    <Text style={styles.metaText} numberOfLines={1}>Зала {schedule.room}</Text>
                  </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
