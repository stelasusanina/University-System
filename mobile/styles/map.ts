import { StyleSheet } from "react-native";

export const mapStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a2e",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  callout: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    minWidth: 200,
    maxWidth: 260,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
  },
  calloutName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1a1a2e",
    marginBottom: 4,
  },
  calloutAddress: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 10,
  },
  navigateBtn: {
    backgroundColor: "#1e3a8a",
    borderRadius: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  navigateBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#f5f7fa",
  },
  errorText: {
    fontSize: 15,
    color: "#ef4444",
    textAlign: "center",
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: "#1e3a8a",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
