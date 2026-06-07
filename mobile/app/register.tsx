import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { loginStyles as styles } from "@/styles/login";

export default function RegisterScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [identifierNumber, setIdentifierNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!firstName || !lastName || !email || !identifierNumber || !password || !confirmPassword) {
      setError("Всички полета са задължителни");
      return;
    }
    if (password !== confirmPassword) {
      setError("Паролите не съвпадат");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await authService.register({ email, identifierNumber, firstName, lastName, password });
      await login(response.token, response.user);
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неуспешна регистрация");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Image
          source={require("../../shared/assets/blue_logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>УниПортал</Text>
        <Text style={styles.subtitle}>Регистрация</Text>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Име</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
        />

        <Text style={styles.label}>Фамилия</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
        />

        <Text style={styles.label}>Имейл</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Факултетен номер</Text>
        <TextInput
          style={styles.input}
          value={identifierNumber}
          onChangeText={setIdentifierNumber}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Парола</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Потвърди парола</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Регистрация</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchLink} onPress={() => router.replace("/login")}>
          <Text style={styles.switchText}>Вече имаш акаунт? <Text style={styles.switchTextBold}>Влез</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
