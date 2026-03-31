import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import api from "./api";
import { supabase } from "./supabaseClient";

export type UserRole = "traveller" | "sender_receiver";
export type UserSubRole = "sender" | "receiver";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  sub_role?: UserSubRole; // Used for sender_receiver role
  phone: string;
  dob?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  profilePhoto?: string;
  walletBalance?: number;
  bio?: string;
  rating?: number;
  totalTrips?: number;
  aadharNumber?: string;
  vehicleType?: string;
  idPhoto?: string;
  livePhoto?: string;
  idNumber?: string;
  idProofType?: string;
  personalOtp?: string;
  personalOtpExpiresAt?: string;
  personalOtpUsed?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  loginWithPhone: (phone: string) => Promise<{ success: boolean; message?: string }>;
  signup: (params: {
    name: string,
    email: string,
    password: string,
    role: UserRole,
    phone: string,
    dob?: string,
    gender?: string,
    address?: string,
    city?: string,
    state?: string,
    pincode?: string,
    idProofType?: string,
    idNumber?: string,
    idPhoto?: string,
    livePhoto?: string,
    profilePhoto?: string,
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (data: any) => Promise<boolean>;
  deleteUser: () => Promise<boolean>;
  switchSubRole: (subRole: UserSubRole) => Promise<boolean>;
  switchMainRole: (role: UserRole) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveUserToStorage = (userData: User) => {
    try {
      // Strip large fields before saving to localStorage to avoid QuotaExceededError
      const { profilePhoto, idPhoto, livePhoto, ...safeUser } = userData;
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
          console.log("AuthContext: Initializing with saved user:", parsedUser.id || parsedUser._id);
          setUser(parsedUser);
          
          // Verify/Refresh profile from backend
          const userId = parsedUser.id || parsedUser._id;
          if (!userId) {
            console.warn("AuthContext: No userId in savedUser, logging out");
            logout();
            return;
          }

          const { data } = await api.get(`/users/${userId}`);
          console.log("AuthContext: Profile refreshed from backend:", data.role);
          const mappedUser = {
            ...data,
            id: data._id || data.id,
          };
          setUser(mappedUser);
          saveUserToStorage(mappedUser);
        } catch (err: any) {
          console.error("Auth initialization failed:", err);
          // Only logout if it's a 401 (Unauthorized) or 404 (Not Found)
          // Don't logout on 500 (Server Error) to avoid kicking users out during backend issues
          const status = err.response?.status;
          if (status === 401 || status === 404) {
            console.warn("AuthContext: Critical auth error, logging out user");
            if (localStorage.getItem('token') === token) {
              logout();
            }
          } else {
            console.log("AuthContext: Non-critical error, keeping local session for now");
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signup = async (params: any) => {
    try {
      const { data } = await api.post('/users/register', params);
      
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

  const loginWithPhone = async (phone: string) => {
    try {
      // Sync with our own backend after Supabase handles OTP
      const { data } = await api.post('/users/login-otp', { phone });

      const mappedUser = {
        ...data,
        id: data._id || data.id,
      };

      localStorage.setItem('token', data.token);
      saveUserToStorage(mappedUser);
      setUser(mappedUser);

      return { success: true };
    } catch (err: any) {
      console.error("Phone login error:", err);
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

  const deleteUser = async () => {
    if (!user) return false;
    try {
      await api.delete('/users/profile');
      logout();
      return true;
    } catch (err) {
      console.error("Delete user error:", err);
      return false;
    }
  };

  const switchSubRole = async (subRole: UserSubRole) => {
    if (!user) return false;
    try {
      // 1. Update Supabase (User's request)
      const { error } = await supabase
        .from('profiles')
        .update({ sub_role: subRole })
        .eq('id', user.id);

      if (error) console.warn("Supabase record not found, skipping storage sync.");

      // 2. Update MongoDB Backend (Persistence for legacy accounts)
      await api.put('/users/profile', { sub_role: subRole });

      const newUser = { ...user, sub_role: subRole };
      setUser(newUser);
      saveUserToStorage(newUser);
      return true;
    } catch (err) {
      console.error("Switch role error:", err);
      return false;
    }
  };

  const switchMainRole = async (role: UserRole) => {
    if (!user) return false;
    try {
      const updateData: any = { role };
      if (role === 'sender_receiver') updateData.sub_role = 'sender';
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      const newUser = { ...user, role, sub_role: updateData.sub_role };
      setUser(newUser);
      saveUserToStorage(newUser);
      return true;
    } catch (err) {
      console.error("Switch main role error:", err);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithPhone, signup, logout, updateUser, deleteUser, switchSubRole, switchMainRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
