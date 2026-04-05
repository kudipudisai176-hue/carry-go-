import { useState, useEffect, type ReactNode } from "react";
import { supabase } from "./supabaseClient";
import { type User as SBUser } from "@supabase/supabase-js";

import { type User, type UserRole, type UserSubRole } from "./authTypes";
import { AuthContext } from "./authContext"; // Source from authContext.ts


const mapSupabaseUser = (sbUser: SBUser, profile: any): User => {
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
    profilePhoto: profile?.profilePhoto || profile?.profile_photo,
    walletBalance: profile?.walletBalance || profile?.wallet_balance || 0,
    bio: profile?.bio,
    rating: profile?.rating || 5,
    totalTrips: profile?.totalTrips || profile?.total_trips || 0,
    aadharNumber: profile?.aadharNumber || profile?.aadhar_number,
    vehicleType: profile?.vehicleType || profile?.vehicle_type,
    idPhoto: profile?.idPhoto || profile?.id_photo,
    livePhoto: profile?.livePhoto || profile?.live_photo,
    idNumber: profile?.idNumber || profile?.id_number,
    idProofType: profile?.idProofType || profile?.id_proof_type,
    personalOtp: profile?.personalOtp || profile?.personal_otp,
    personalOtpUsed: profile?.personalOtpUsed || profile?.personal_otp_used
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          try {
            const { data: profile, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (!error && profile) {
              const mappedUser = mapSupabaseUser(session.user, profile);
              setUser(mappedUser);
            } else {
               setUser(mapSupabaseUser(session.user, {}));
            }
          } catch (err) {
            console.error("Auth profile fetch failed:", err);
            setUser(mapSupabaseUser(session.user, {}));
          }
        }
      } catch (err) {
        console.error("Critical auth initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
         const { data: profile } = await supabase
            .from('users')
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
      
      console.log("Supabase Auth signUp initiated...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role, sub_role, phone }
        }
      });

      if (authError) {
        console.error("Supabase authError:", authError.message || authError);
        throw authError;
      }
      if (!authData.user) throw new Error("Signup failed: No user returned from auth");

      console.log("Auth user created success, ID:", authData.user.id);

      // Map camelCase fields to snake_case for Supabase if they exist
      const profileData: any = {
        id: authData.user.id,
        name,
        email,
        phone,
        role,
        sub_role,
        dob: rest.dob,
        gender: rest.gender,
        address: rest.address,
        id_proof_type: rest.idProofType,
        id_number: rest.idNumber,
        id_photo: rest.idPhoto,
        live_photo: rest.livePhoto,
        profile_photo: rest.profilePhoto || rest.livePhoto,
        bio: rest.bio,
        vehicle_type: rest.vehicleType,
        aadhar_number: rest.aadharNumber || (rest.idProofType === 'Aadhaar' ? rest.idNumber : undefined)
      };

      // Remove undefined values
      Object.keys(profileData).forEach(key => profileData[key] === undefined && delete profileData[key]);

      console.log("Inserting profile into 'users' table... payload size hint:", JSON.stringify(profileData).length);
      
      // Use a timeout of 60 seconds to prevent infinite hang (suitable for photo uploads)
      const insertWithTimeout = Promise.race([
        supabase.from('users').insert(profileData),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database connection took too long (60 seconds). Please check your internet.")), 60000))
      ]);

      const { error: profileError } = await (insertWithTimeout as any);

      if (profileError) {
        console.error("Profile creation in 'users' table failed:", profileError.message || profileError);
        return { success: false, message: `Account created but profile setup failed: ${profileError.message}` };
      }
      
      console.log("Signup process complete!");
      return { success: true };
    } catch (err: any) {
      console.error("Signup error:", err.message || err);
      return { success: false, message: err.message || "Signup failed" };
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
      // Map frontend camelCase properties to DB snake_case columns
      const up: any = {};
      if (data.name !== undefined) up.name = data.name;
      if (data.phone !== undefined) up.phone = data.phone;
      if (data.role !== undefined) up.role = data.role;
      if (data.sub_role !== undefined) up.sub_role = data.sub_role;
      if (data.bio !== undefined) up.bio = data.bio;
      if (data.profilePhoto !== undefined) up.profile_photo = data.profilePhoto;
      if (data.walletBalance !== undefined) up.wallet_balance = data.walletBalance;
      if (data.rating !== undefined) up.rating = data.rating;
      if (data.totalTrips !== undefined) up.total_trips = data.totalTrips;
      if (data.vehicleType !== undefined) up.vehicle_type = data.vehicleType;
      if (data.personalOtp !== undefined) up.personal_otp = data.personalOtp;
      if (data.personalOtpExpiresAt !== undefined) up.personal_otp_expires_at = data.personalOtpExpiresAt;
      if (data.address !== undefined) up.address = data.address;
      if (data.city !== undefined) up.city = data.city;
      if (data.state !== undefined) up.state = data.state;
      if (data.pincode !== undefined) up.pincode = data.pincode;
      
      // Additional fields from User interface
      if (data.aadharNumber !== undefined) up.aadhar_number = data.aadharNumber;
      if (data.idPhoto !== undefined) up.id_photo = data.idPhoto;
      if (data.livePhoto !== undefined) up.live_photo = data.livePhoto;
      if (data.idNumber !== undefined) up.id_number = data.idNumber;
      if (data.idProofType !== undefined) up.id_proof_type = data.idProofType;
      if (data.personalOtpUsed !== undefined) up.personal_otp_used = data.personalOtpUsed;
      
      const { error: profileError } = await supabase
        .from('users')
        .update(up)
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
      // Deleting from users (Supabase RPC or Auth function needed for full deletion)
      await supabase.from('users').delete().eq('id', user.id);
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
        .from('users')
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
        .from('users')
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

