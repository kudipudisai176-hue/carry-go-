import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "./api";

export type UserRole = "sender" | "traveller" | "receiver";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  vehicleType?: string;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole }>;
  signup: (params: {
    name: string,
    email: string,
    password: string,
    role: UserRole,
    phone: string,
    vehicleType?: string,
    adharNumber?: string,
    adharPhoto?: string,
    livePhoto?: string,
  }) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("carrygo_user");
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    if (u) localStorage.setItem("carrygo_user", JSON.stringify(u));
    else localStorage.removeItem("carrygo_user");
  };

  const signup = async (params: {
    name: string,
    email: string,
    password: string,
    role: UserRole,
    phone: string,
    vehicleType?: string,
    adharNumber?: string,
    adharPhoto?: string,
    livePhoto?: string,
  }) => {
    try {
      const resp = await api.post("/auth/register", params);
      const data = resp.data;
      persist({
        ...data.user,
        token: data.token
      });
      return true;
    } catch (err) {
      console.error("Signup error:", err);
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const resp = await api.post("/auth/login", { email, password });
      const data = resp.data;
      persist({
        ...data.user,
        token: data.token
      });
      return { success: true, role: data.user.role };
    } catch (err) {
      console.error("Login error:", err);
      return { success: false };
    }
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
