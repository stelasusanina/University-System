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
import { openBrowserAsync } from "expo-web-browser";
import { api } from "@/services/api";
import { materialStyles as styles } from "@/styles/materials";
import type { StudentMaterials, CourseWithMaterials, Material } from "@shared/types/materials";

const OFFICE_EXTENSIONS = new Set(["doc", "docx", "ppt", "pptx", "xls", "xlsx"]);

const FILE_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  pdf: { name: "document-text-outline", color: "#ef4444" },
  doc: { name: "document-outline", color: "#2563eb" },
  docx: { name: "document-outline", color: "#2563eb" },
  ppt: { name: "easel-outline", color: "#ea580c" },
  pptx: { name: "easel-outline", color: "#ea580c" },
  xls: { name: "grid-outline", color: "#16a34a" },
  xlsx: { name: "grid-outline", color: "#16a34a" },
  zip: { name: "archive-outline", color: "#7c3aed" },
  rar: { name: "archive-outline", color: "#7c3aed" },
};

function getFileIcon(fileType: string) {
  return FILE_ICONS[fileType.toLowerCase()] ?? { name: "attach-outline" as keyof typeof Ionicons.glyphMap, color: "#64748b" };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildPreviewUrl(url: string, fileType: string): string {
  if (OFFICE_EXTENSIONS.has(fileType.toLowerCase())) {
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
  }
  return url;
}

function semesterKey(course: CourseWithMaterials) {
  return `${course.year}-${course.semester}`;
}

function CourseSection({
  course,
  expanded,
  onToggle,
}: {
  course: CourseWithMaterials;
  expanded: boolean;
  onToggle: () => void;
}) {
  function handleDownload(material: Material) {
    Linking.openURL(material.fileUrl).catch(() => {});
  }

  async function handlePreview(material: Material) {
    await openBrowserAsync(buildPreviewUrl(material.fileUrl, material.fileType));
  }

  return (
    <View style={styles.courseSection}>
      <TouchableOpacity style={styles.courseHeader} onPress={onToggle}>
        <View style={styles.courseTitleRow}>
          <Text style={styles.courseCode}>{course.code}</Text>
          <View style={styles.materialCount}>
            <Text style={styles.materialCountText}>{course.materials.length}</Text>
          </View>
        </View>
        <View style={styles.courseHeaderRight}>
          <Text style={styles.courseName}>{course.name}</Text>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color="#94a3b8" />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.materialList}>
          {course.materials.length === 0 ? (
            <View style={styles.emptyMaterials}>
              <Text style={styles.emptyMaterialsText}>Няма качени материали</Text>
            </View>
          ) : course.materials.map((material) => {
            const icon = getFileIcon(material.fileType);
            return (
              <View key={material.id} style={styles.materialItem}>
                <View style={styles.materialIcon}>
                  <Ionicons name={icon.name} size={22} color={icon.color} />
                </View>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialTitle}>{material.title}</Text>
                  {material.description && (
                    <Text style={styles.materialDesc} numberOfLines={2}>
                      {material.description}
                    </Text>
                  )}
                  <Text style={styles.materialMeta}>
                    Качено на {formatDate(material.uploadedAt)}
                  </Text>
                </View>
                <View style={styles.materialActions}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handlePreview(material)}>
                    <Ionicons name="eye-outline" size={18} color="#1e3a8a" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDownload(material)}>
                    <Ionicons name="download-outline" size={18} color="#1e3a8a" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function MaterialsScreen() {
  const [data, setData] = useState<StudentMaterials | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState<number | null>(null);

  function loadMaterials() {
    api
      .get<StudentMaterials>("/materials/courses")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch(() => {
        setError("Неуспешно зареждане на материалите. Опитайте отново.");
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }

  useEffect(() => {
    loadMaterials();
  }, []);

  function onRefresh() {
    setRefreshing(true);
    loadMaterials();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Зареждане на материалите...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error ?? "Няма данни."}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadMaterials(); }}>
          <Text style={styles.retryBtnText}>Опитай отново</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const allCourses = data.courses;

  const semesters = Array.from(
    new Map(allCourses.map((c) => [semesterKey(c), { year: c.year, semester: c.semester }])).entries()
  ).sort(([a], [b]) => a.localeCompare(b));

  const selectedIsEmpty = selectedSemester?.startsWith("x-") ?? false;

  const filteredCourses = (selectedSemester && !selectedIsEmpty)
    ? allCourses.filter((c) => semesterKey(c) === selectedSemester)
    : selectedIsEmpty ? [] : allCourses;

  function handleToggle(courseId: number) {
    setExpandedCourseId((prev) => (prev === courseId ? null : courseId));
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Материали</Text>
        <Text style={styles.subtitle}>
          {filteredCourses.length} {filteredCourses.length === 1 ? "дисциплина" : "дисциплини"}
        </Text>
      </View>

      <TouchableOpacity style={styles.filterToggle} onPress={() => setFiltersOpen((v) => !v)}>
        <Ionicons name="filter-outline" size={15} color="#1e3a8a" />
        <Text style={styles.filterToggleText}>Филтри</Text>
        <Ionicons name={filtersOpen ? "chevron-up" : "chevron-down"} size={14} color="#94a3b8" style={styles.filterChevron} />
      </TouchableOpacity>

      {filtersOpen && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterPanelLabel}>Филтрирай по семестър:</Text>
          <View style={styles.filterChips}>
            <TouchableOpacity
              style={[styles.filterChip, selectedSemester === null && styles.filterChipActive]}
              onPress={() => { setSelectedSemester(null); setFiltersOpen(false); }}
            >
              <Text style={[styles.filterChipText, selectedSemester === null && styles.filterChipTextActive]}>
                Всички
              </Text>
            </TouchableOpacity>
            {[1, 2, 3, 4, 5, 6, 7].map((s) => {
              const key = semesters.find(([, v]) => v.semester === s)?.[0] ?? `x-${s}`;
              const isActive = selectedSemester === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => { setSelectedSemester(isActive ? null : key); setFiltersOpen(false); }}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {String(s)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {filteredCourses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="folder-open-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>
            {selectedIsEmpty ? "Няма материали за този семестър" : "Няма качени материали"}
          </Text>
        </View>
      ) : (
        filteredCourses.map((course) => (
          <CourseSection
            key={course.id}
            course={course}
            expanded={expandedCourseId === course.id}
            onToggle={() => handleToggle(course.id)}
          />
        ))
      )}
    </ScrollView>
  );
}
