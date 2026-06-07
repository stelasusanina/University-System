import { StyleSheet } from "react-native";

export const gradeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 32,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
  },
  errorText: {
    fontSize: 14,
    color: "#ef4444",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 4,
    backgroundColor: "#1e3a8a",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  header: {
    gap: 12,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  overallGpa: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  overallGpaLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  overallGpaValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    fontStyle: "italic",
  },
  semesterBlock: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  semesterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  semesterTitleRow: {
    gap: 2,
    flex: 1,
  },
  semesterName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  semesterPeriod: {
    fontSize: 12,
    color: "#64748b",
  },
  semesterHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gpaBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  gpaText: {
    fontSize: 13,
    fontWeight: "700",
  },
  enrollmentList: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  enrollmentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  enrollmentInfo: {
    flex: 1,
    gap: 3,
  },
  courseName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 20,
  },
  courseMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  gradePill: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 64,
  },
  gradeNumber: {
    fontSize: 18,
    fontWeight: "800",
  },
  gradeLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
});
