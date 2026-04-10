import { useState, useEffect, type ReactNode } from "react";
import { api } from "./parcelStore";
import { type User, type UserRole, type UserSubRole } from "./authTypes";
import { AuthContext } from "./authContext";

const API_URL = "/users";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (token: string) => {
    try {
      const { data } = await api.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        await fetchProfile(token);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signup = async (params: any) => {
    try {
      const { data } = await api.post(`${API_URL}/register`, params);
      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data);
        return { success: true };
      }
      return { success: false, message: "Signup failed: No token received" };
    } catch (err: any) {
      console.error("Signup error:", err);
      return { success: false, message: err.response?.data?.message || "Signup failed" };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post(`${API_URL}/login`, { email, password });
      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data);
        return { success: true };
      }
      return { success: false, message: "Login failed: No token received" };
    } catch (err: any) {
      console.error("Login error:", err);
      return { success: false, message: err.response?.data?.message || "Login failed" };
    }
  };

  const loginWithPhone = async (phone: string) => {
    try {
      const { data } = await api.post(`${API_URL}/login-otp`, { phone });
      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data);
        return { success: true };
      }
      return { success: false, message: "Phone login failed: No token received" };
    } catch (err: any) {
      console.error("Phone login error:", err);
      return { success: false, message: err.response?.data?.message || "Phone login failed" };
    }
  };

  const logout = async () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      const resp = await api.put(`${API_URL}/profile`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(resp.data);
      if (resp.data.token) localStorage.setItem("token", resp.data.token);
      return true;
    } catch (err) {
      console.error("Update profile error:", err);
      return false;
    }
  };

  const deleteUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) return false;
    try {
      await api.delete(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await logout();
      return true;
    } catch (err) {
      console.error("Delete user error:", err);
      return false;
    }
  };

  const switchSubRole = async (subRole: UserSubRole) => {
    return updateUser({ sub_role: subRole });
  };

  const switchMainRole = async (role: UserRole) => {
    const updateData: any = { role };
    if (role === 'sender_receiver') updateData.sub_role = 'sender';
    return updateUser(updateData);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithPhone, signup, logout, updateUser, deleteUser, switchSubRole, switchMainRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
