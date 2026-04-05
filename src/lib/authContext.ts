
import { createContext, useContext } from "react";
import { type User, type UserRole, type UserSubRole } from "./authTypes";

export interface AuthContextType {
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
    [key: string]: any
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUser: (data: any) => Promise<boolean>;
  deleteUser: () => Promise<boolean>;
  switchSubRole: (subRole: UserSubRole) => Promise<boolean>;
  switchMainRole: (role: UserRole) => Promise<boolean>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export type { User, UserRole, UserSubRole };
