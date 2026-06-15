import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { gradeStyles as styles } from "@/styles/grades";
import type { SemesterGrades } from "@shared/types/grades";
import { ROLE_LABELS } from "@shared/types/auth";

function SemesterBlock({ sg, expanded, onToggle }: { sg: SemesterGrades; expanded: boolean; onToggle: () => void }) {
  const graded = sg.grades.filter((e) => e.finalGrade !== null);
  const gpa = graded.length > 0
    ? (graded.reduce((s, e) => s + e.finalGrade!, 0) / graded.length).toFixed(2)
    : null;

  return (
    <View style={styles.semesterBlock}>
      <TouchableOpacity style={styles.semesterHeader} onPress={onToggle}>
        <View style={styles.semesterTitleRow}>
          <Text style={styles.semesterName}>{sg.semester.name}</Text>
        </View>
        <View style={styles.semesterHeaderRight}>
          {gpa && (
            <View style={styles.gpaBadge}>
              <Text style={styles.gpaText}>ср. успех: {gpa}</Text>
            </View>
          )}
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#94a3b8" />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.enrollmentList}>
          {sg.grades.map((e, index) => (
            <View key={e.id ?? `no-grade-${index}`} style={styles.enrollmentRow}>
              <View style={styles.enrollmentInfo}>
                <Text style={styles.courseName} numberOfLines={2}>{e.course.name}</Text>
                <Text style={styles.courseMeta}>
                  {ROLE_LABELS[e.course.academicStaff.role] ?? e.course.academicStaff.role} {e.course.academicStaff.lastName}
                </Text>
              </View>
              <View style={styles.gradePill}>
                <Text style={styles.gradeNumber}>
                  {e.finalGrade ?? "-"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function GradesScreen() {
  const [semesters, setSemesters] = useState<SemesterGrades[]>([]);
  const [expandedSemester, setExpandedSemester] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  function loadGrades() {
    api
      .get<{ semesters: SemesterGrades[] }>("/grades/my")
      .then((res) => {
        setSemesters(res.semesters);
        setError(null);
      })
      .catch(() => setError("Неуспешно зареждане на оценките. Опитайте отново."))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => { loadGrades(); }, []);

  function onRefresh() {
    setRefreshing(true);
    loadGrades();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Зареждане на оценките...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadGrades(); }}>
          <Text style={styles.retryBtnText}>Опитай отново</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allGraded = semesters.flatMap((sg) => sg.grades.filter((e) => e.finalGrade !== null));
  const overallGpa = allGraded.length > 0
    ? (allGraded.reduce((s, e) => s + e.finalGrade!, 0) / allGraded.length).toFixed(2)
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Оценки</Text>
        {overallGpa && (
          <View style={styles.overallGpa}>
            <Text style={styles.overallGpaLabel}>Общ среден успех</Text>
            <Text style={styles.overallGpaValue}>{overallGpa}</Text>
          </View>
        )}
      </View>

      {semesters.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="school-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>Няма намерени оценки</Text>
        </View>
      ) : (
        semesters.map((sg) => (
          <SemesterBlock
            key={sg.semester.id}
            sg={sg}
            expanded={expandedSemester === sg.semester.id}
            onToggle={() => setExpandedSemester(expandedSemester === sg.semester.id ? null : sg.semester.id)}
          />
        ))
      )}
    </ScrollView>
  );
}
