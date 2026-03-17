import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "./supabaseClient";

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
  updateUser: (data: { name?: string, profilePhoto?: string }) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email!);
      } else {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setUser({
          id: data.id,
          name: data.name,
          email: email,
          role: data.role,
          phone: data.phone,
          vehicleType: data.vehicle_type,
          walletBalance: data.wallet_balance,
          adharNumber: data.adhar_number,
          adharPhoto: data.adhar_photo_url,
          profilePhoto: data.profile_photo_url,
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false);
    }
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
      // 1. Sign up the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: params.email,
        password: params.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      // 2. Create the profile in the 'profiles' table
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          name: params.name,
          email: params.email,
          role: params.role,
          phone: params.phone,
          vehicle_type: params.vehicleType,
          adhar_number: params.adharNumber,
          adhar_photo_url: params.adharPhoto,
          profile_photo_url: params.livePhoto,
        }]);

      if (profileError) throw profileError;

      return { success: true };
    } catch (err: any) {
      console.error("Signup error:", err.message);
      return { success: false, message: err.message };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      console.error("Login error:", err.message);
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const updateUser = async (data: { name?: string, profilePhoto?: string }) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          profile_photo_url: data.profilePhoto,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setUser(prev => prev ? { ...prev, ...data } : null);
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
