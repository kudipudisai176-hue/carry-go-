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
  walletBalance?: number;
  adharNumber?: string;
  adharPhoto?: string;
  profilePhoto?: string;
  bio?: string;
  rating?: number;
  totalTrips?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
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
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (data: { name?: string, profilePhoto?: string, bio?: string, vehicleType?: string, adharNumber?: string, adharPhoto?: string }) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveUserToStorage = (userData: User) => {
    try {
      // Strip large fields before saving to localStorage to avoid QuotaExceededError
      const { profilePhoto, adharPhoto, ...safeUser } = userData;
      localStorage.setItem('user', JSON.stringify(safeUser));
    } catch (err) {
      console.error("Failed to save user to storage:", err);
      // If it still fails, clear the user key to prevent staleness
      localStorage.removeItem('user');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Verify/Refresh profile from backend
          const { data } = await api.get(`/users/${parsedUser.id || parsedUser._id}`);
          const mappedUser = {
            ...data,
            id: data._id || data.id,
          };
          setUser(mappedUser);
          saveUserToStorage(mappedUser);
        } catch (err) {
          console.error("Auth initialization failed:", err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signup = async (params: any) => {
    try {
      const { data } = await api.post('/users/register', {
        ...params,
        profilePhoto: params.livePhoto, // Mapping frontend field to backend field
      });
      
      const mappedUser = {
        ...data,
        id: data._id || data.id,
      };

      localStorage.setItem('token', data.token);
      saveUserToStorage(mappedUser);
      setUser(mappedUser);
      
      return { success: true };
    } catch (err: any) {
      console.error("Signup error:", err.response?.data?.message || err.message);
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/users/login', { email, password });
      
      const mappedUser = {
        ...data,
        id: data._id || data.id,
      };

      localStorage.setItem('token', data.token);
      saveUserToStorage(mappedUser);
      setUser(mappedUser);
      
      return { success: true };
    } catch (err: any) {
      console.error("Login error:", err.response?.data?.message || err.message);
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = async (data: any) => {
    if (!user) return false;
    try {
      const { data: updatedData } = await api.put('/users/profile', data);
      
      const mappedUser = {
        ...updatedData,
        id: updatedData._id || updatedData.id,
      };

      setUser(mappedUser);
      saveUserToStorage(mappedUser);
      return true;
    } catch (err) {
      console.error("Update profile error:", err);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

