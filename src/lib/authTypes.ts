
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
