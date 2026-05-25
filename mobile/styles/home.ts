import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
    color: "#1a1a2e",
  },
  email: {
    fontSize: 14,
    color: "#555",
    marginBottom: 24,
  },
  logoutBtn: {
    backgroundColor: "#e74c3c",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
