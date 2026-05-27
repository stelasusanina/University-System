import { StyleSheet } from "react-native";

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  inner: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
    color: "#1a1a2e",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 28,
    color: "#555",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 16,
    color: "#222",
  },
  button: {
    backgroundColor: "#3b5bdb",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#a0a0c0",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorBox: {
    backgroundColor: "#ffe0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#c0392b",
    fontSize: 14,
    textAlign: "center",
  },
});
