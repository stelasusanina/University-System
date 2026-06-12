import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Calendar, type DateData } from "react-native-calendars";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { homeStyles as styles } from "@/styles/home";
import type { EventItem } from "@shared/types/events";
import type { Announcement } from "@shared/types/announcements";

const TYPE_COLORS: Record<string, string> = {
  "ИНФОРМАЦИЯ": "#3b82f6",
  "ОТМЯНА": "#ef4444",
  "ЗАКЪСНЕНИЕ": "#f59e0b",
  "СМЯНА_НА_ЗАЛА": "#8b5cf6",
  "СПЕШНО": "#dc2626",
};

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  function loadData() {
    api
      .get<{ dates: string[]; events: EventItem[] }>("/events/dates")
      .then((res) => {
        setEvents(res.events);
        const marks: Record<string, any> = {};
        for (const d of res.dates) {
          marks[d] = { marked: true, dotColor: "#1e3a8a" };
        }
        setMarkedDates(marks);
      })
      .catch(() => {});

    api.get<Announcement[]>("/announcements").then(setAnnouncements).catch(() => {});
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }

  const selectedEvents = events.filter(
    (e) => e.date.split("T")[0] === selectedDate
  );

  const today = new Date().toISOString().split("T")[0];

  const calendarMarked = {
    ...markedDates,
    [today]: {
      ...(markedDates[today] || {}),
      selected: true,
      selectedColor: "#1e3a8a",
    },
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>
          Добре дошли, {user?.firstName} {user?.lastName}
        </Text>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Изход</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Calendar
          onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
          markedDates={calendarMarked}
          theme={{
            todayTextColor: "#fff",
            arrowColor: "#1e3a8a",
            dotColor: "#1e3a8a",
          }}
        />

        <View style={styles.eventsSection}>
          <Text style={styles.eventsTitle}>
            {selectedDate}
          </Text>
          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => (
              <View key={event.id} style={styles.eventItem}>
                <Text style={styles.eventType}>{event.type}</Text>
                <Text style={styles.eventCourse}>{event.course.name}</Text>
                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.startTime && (
                  <Text style={styles.eventMeta}>
                    {event.startTime}
                    {event.endTime ? `–${event.endTime}` : ""}
                  </Text>
                )}
                {event.room && (
                  <Text style={styles.eventMeta}>Зала {event.room}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noEvents}>Няма планирани събития</Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Съобщения</Text>
        {announcements.length > 0 ? (
          announcements.map((a) => (
            <View
              key={a.id}
              style={[
                styles.announcementItem,
              ]}
            >
              <View style={styles.announcementHeader}>
                <Text
                  style={[
                    styles.announcementBadge,
                    { backgroundColor: TYPE_COLORS[a.type] || "#94a3b8" },
                  ]}
                >
                  {a.type.replaceAll("_", " ")}
                </Text>
                <Text style={styles.announcementTime}>
                  {new Date(a.createdAt).toLocaleDateString("bg-BG", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <Text style={styles.announcementMessage}>{a.message}</Text>
              {a.academicStaff && (
                <Text style={styles.announcementAuthor}>
                  — {a.academicStaff.role} {a.academicStaff.firstName}{" "}
                  {a.academicStaff.lastName}
                </Text>
              )}
              {a.courseGroup?.course && (
                <Text style={styles.announcementCourse}>{a.courseGroup.course.name}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.noEvents}>Няма съобщения</Text>
        )}
      </View>
    </ScrollView>
  );
}
