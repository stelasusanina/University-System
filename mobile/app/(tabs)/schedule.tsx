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
import { api } from "@/services/api";
import { scheduleStyles as styles } from "@/styles/schedule";
import type { StudentProgram, CourseWithSchedule, ScheduleEntry } from "@shared/types/schedule";

const DAYS = [
  { key: "ПОНЕДЕЛНИК", short: "Пон" },
  { key: "ВТОРНИК", short: "Вт" },
  { key: "СРЯДА", short: "Ср" },
  { key: "ЧЕТВЪРТЪК", short: "Чет" },
  { key: "ПЕТЪК", short: "Пет" },
] as const;

type DayKey = (typeof DAYS)[number]["key"];

const SCHEDULE_TYPE_COLORS: Record<string, string> = {
  ЛЕКЦИЯ: "#1e3a8a",
  СЕМИНАРНО_УПРАЖНЕНИЕ: "#059669",
  ЛАБОРАТОРНО_УПРАЖНЕНИЕ: "#d97706",
};

const SCHEDULE_TYPE_LABELS: Record<string, string> = {
  ЛЕКЦИЯ: "Лекция",
  СЕМИНАРНО_УПРАЖНЕНИЕ: "Семинар",
  ЛАБОРАТОРНО_УПРАЖНЕНИЕ: "Лаборатория",
};

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

  async function onRefresh() {
    setRefreshing(true);
    loadProgram();
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Зареждане на програмата...</Text>
      </View>
    );
  }

  if (error || !program) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error ?? "Няма данни за програмата."}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadProgram(); }}>
          <Text style={styles.retryText}>Опитай отново</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const entriesForDay: DayEntry[] = program.courses.flatMap((course) =>
    course.schedules
      .filter((s) => s.dayOfWeek === selectedDay)
      .map((schedule) => ({ course, schedule }))
  );
  entriesForDay.sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime));

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
        <Text style={styles.semesterText}>
          {program.semester.name} · {program.semester.period}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabs}
        scrollEnabled={false}
      >
        {DAYS.map((day) => {
          const isActive = selectedDay === day.key;
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
      </ScrollView>

      {entriesForDay.length === 0 ? (
        <Text style={styles.emptyDay}>Няма часове в този ден</Text>
      ) : (
        entriesForDay.map(({ course, schedule }) => {
          const typeColor = SCHEDULE_TYPE_COLORS[schedule.type] ?? "#64748b";
          const typeLabel = SCHEDULE_TYPE_LABELS[schedule.type] ?? schedule.type;
          return (
            <View
              key={schedule.id}
              style={[styles.scheduleCard, { borderLeftColor: typeColor }]}
            >
              <Text style={styles.scheduleTime}>
                {schedule.startTime} – {schedule.endTime}
              </Text>
              <Text style={styles.scheduleCourse}>{course.name}</Text>
              <Text style={[styles.scheduleType, { backgroundColor: typeColor }]}>
                {typeLabel}
              </Text>
              <Text style={styles.scheduleMeta}>
                Зала {schedule.room}
              </Text>
              {schedule.building && (
                <>
                  <Text style={styles.scheduleMeta}>
                    {schedule.building.name} · {schedule.building.address}
                  </Text>
                  {(schedule.building.latitude != null && schedule.building.longitude != null) && (
                    <TouchableOpacity
                      onPress={() => {
                        const { latitude, longitude, name } = schedule.building!;
                        const label = encodeURIComponent(name);
                        Linking.openURL(`https://maps.google.com/?q=${latitude},${longitude}(${label})`).catch(() => {});
                      }}
                    >
                      <Text style={styles.buildingLink}>Отвори в Google Maps</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
              <Text style={styles.scheduleLecturer}>
                {course.lecturer.title} {course.lecturer.firstName} {course.lecturer.lastName}
              </Text>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
