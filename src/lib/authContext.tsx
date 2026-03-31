import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "./supabaseClient";
import { type User as SBUser } from "@supabase/supabase-js";

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
    sub_role?: UserSubRole,
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

const mapSupabaseUser = (sbUser: SBUser, profile: Partial<User>): User => {
  return {
    id: sbUser.id,
    name: profile?.name || sbUser.user_metadata?.name || '',
    email: sbUser.email || '',
    role: profile?.role || sbUser.user_metadata?.role || "sender_receiver",
    sub_role: profile?.sub_role || sbUser.user_metadata?.sub_role,
    phone: profile?.phone || sbUser.phone || '',
    dob: profile?.dob,
    gender: profile?.gender,
    address: profile?.address,
    city: profile?.city,
    state: profile?.state,
    pincode: profile?.pincode,
    profilePhoto: profile?.profilePhoto,
    walletBalance: profile?.walletBalance || 0,
    bio: profile?.bio,
    rating: profile?.rating || 5,
    totalTrips: profile?.totalTrips || 0,
    aadharNumber: profile?.aadharNumber,
    vehicleType: profile?.vehicleType,
    idPhoto: profile?.idPhoto,
    livePhoto: profile?.livePhoto,
    idNumber: profile?.idNumber,
    idProofType: profile?.idProofType,
    personalOtp: profile?.personalOtp,
    personalOtpUsed: profile?.personalOtpUsed
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!error && profile) {
            const mappedUser = mapSupabaseUser(session.user, profile);
            setUser(mappedUser);
          } else {
             // If no profile, try to use metadata
             setUser(mapSupabaseUser(session.user, {}));
          }
        } catch (err) {
          console.error("Auth initialization failed:", err);
        }
      }
      setIsLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
         const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
         setUser(mapSupabaseUser(session.user, profile || {}));
      } else if (event === 'SIGNED_OUT') {
         setUser(null);
      }
    });

    initAuth();
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signup = async (params: {
    name: string,
    email: string,
    password: string,
    role: UserRole,
    sub_role?: UserSubRole,
    phone: string,
    [key: string]: any
  }) => {
    try {
      const { email, password, name, role, sub_role, phone, ...rest } = params;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role, sub_role, phone }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed: No user returned");

      // Create profile record (Supabase uses Trigger/Functions for this usually, but we do it manually to match Node logic)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name,
          email,
          phone,
          role,
          sub_role,
          ...rest
        });

      if (profileError) {
        console.warn("Auth user created but profile creation failed:", profileError);
        // Continue anyway as metadata might work, or let trigger handle it
      }
      
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      console.error("Signup error:", message);
      return { success: false, message: message };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      console.error("Login error:", message);
      return { success: false, message: message };
    }
  };

  const loginWithPhone = async (phone: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      return { success: true, message: "OTP sent to your phone" };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Phone login failed";
      console.error("Phone login error:", message);
      return { success: false, message: message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return false;
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      
      if (profileError) throw profileError;

      // Also update auth metadata if relevant
      if (data.name || data.role) {
         await supabase.auth.updateUser({
            data: { name: data.name, role: data.role }
         });
      }

      setUser({ ...user, ...data });
      return true;
    } catch (err) {
      console.error("Update profile error:", err);
      return false;
    }
  };

  const deleteUser = async () => {
    if (!user) return false;
    try {
      // Deleting from profiles (Supabase RPC or Auth function needed for full deletion)
      await supabase.from('profiles').delete().eq('id', user.id);
      await logout();
      return true;
    } catch (err) {
      console.error("Delete user error:", err);
      return false;
    }
  };

  const switchSubRole = async (subRole: UserSubRole) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ sub_role: subRole })
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, sub_role: subRole });
      return true;
    } catch (err) {
      console.error("Switch role error:", err);
      return false;
    }
  };

  const switchMainRole = async (role: UserRole) => {
    if (!user) return false;
    try {
      const updateData: Partial<User> = { role };
      if (role === 'sender_receiver') updateData.sub_role = 'sender';
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      setUser({ ...user, ...updateData });
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
