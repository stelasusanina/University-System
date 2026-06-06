import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@shared/types/auth";
import { api } from "@/services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseJwtExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.exp ?? null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string): boolean {
  const exp = parseJwtExp(token);
  if (!exp) {
    return true;
  }
  return exp * 1000 <= Date.now();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedToken && storedUser && !isTokenExpired(storedToken)) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
      }

      setIsReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    const exp = parseJwtExp(token);
    if (!exp) {
      logout();
      return;
    }

    const ms = exp * 1000 - Date.now();
    const timer = setTimeout(() => logout(), ms);
    return () => clearTimeout(timer);
  }, [token]);

  const login = async (newToken: string, newUser: User) => {
    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    const pushToken = await AsyncStorage.getItem("pushToken");
    if (pushToken) {
      api.delete("/push-token", { token: pushToken }).catch(() => {});
      await AsyncStorage.removeItem("pushToken");
    }
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
