import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { homeStyles as styles } from "@/styles/home";

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Начало</Text>
      {user && (
        <Text style={styles.email}>{user.email}</Text>
      )}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Изход</Text>
      </TouchableOpacity>
    </View>
  );
}
