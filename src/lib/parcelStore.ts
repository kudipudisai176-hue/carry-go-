import api from "./api";
import axios from 'axios';

export type ParcelStatus = 'pending_payment' | 'open_for_travellers' | 'pending' | 'requested' | 'accepted' | 'picked-up' | 'in-transit' | 'delivered' | 'received' | 'completed' | 'cancelled';

export interface UserData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  bio?: string;
  rating: number;
  totalTrips: number;
  adharNumber?: string;
  vehicleType?: string;
  adharPhoto?: string;
  personalOtp?: string;
  personalOtpExpiresAt?: string;
  personalOtpUsed?: boolean;
}

export interface Parcel {
  id: string;
  senderId: string;
  senderName: string;
  senderPhone?: string;
  receiverName: string;
  receiverPhone: string;
  fromLocation: string;
  toLocation: string;
  weight: number;
  size: 'small' | 'medium' | 'large' | 'very-large';
  itemCount: number;
  city?: string;
  village?: string;
  vehicleType?: string;
  paymentMethod: 'pay-now' | 'pay-on-delivery';
  paymentStatus: 'pending' | 'unpaid' | 'paid' | 'failed'; // Modified
  escrow_status?: 'held' | 'released' | 'none'; // Added
  distance: number;
  price?: number;
  parcelCharge?: number; // Added
  platformFee?: number; // Added
  description: string;
  status: ParcelStatus;
  travellerId?: string;
  travellerName?: string;
  travellerPhone?: string;
  travellerAdharNumber?: string;
  travellerAdharPhoto?: string;
  travellerPhoto?: string;
  pickupOtp?: string;
  deliveryOtp?: string;
  paymentReleased?: boolean;
  parcelPhoto?: string;
  deliveryPhoto?: string;
  receivedPhoto?: string;
  receiverRating?: number;
  createdAt: string;
  senderData?: UserData;
  travellerData?: UserData;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper to map DB columns to Frontend interface
const mapParcel = (p: any): Parcel => {
  if (!p) return {} as Parcel;
  return {
    id: p._id || p.id,
  senderId: p.sender || p.senderId,
  senderName: p.senderName,
  senderPhone: p.senderPhone,
  receiverName: p.receiverName,
  receiverPhone: p.receiverPhone,
  fromLocation: p.fromLocation,
  toLocation: p.toLocation,
  weight: p.weight,
  size: p.size,
  itemCount: p.itemCount,
  city: p.city,
  village: p.village,
  vehicleType: p.vehicleType,
  paymentMethod: p.paymentMethod,
  paymentStatus: p.paymentStatus,
  escrow_status: p.escrow_status, // Added
  distance: p.distance || 0,
  price: p.price || 0,
  parcelCharge: p.parcelCharge, // Added
  platformFee: p.platformFee, // Added
  description: p.description,
  status: p.status,
  travellerId: p.traveller || p.travellerId,
  travellerName: p.travellerName,
  travellerPhone: p.travellerPhone,
  travellerAdharNumber: p.travellerAdharNumber,
  travellerAdharPhoto: p.travellerAdharPhoto,
  travellerPhoto: p.travellerPhoto,
  pickupOtp: p.pickupOtp,
  deliveryOtp: p.deliveryOtp,
  paymentReleased: p.paymentReleased,
  parcelPhoto: p.parcelPhoto,
  deliveryPhoto: p.deliveryPhoto || p.delivery_proof,
  receivedPhoto: p.receivedPhoto,
  receiverRating: p.receiverRating,
  createdAt: p.createdAt,
  senderData: p.sender && typeof p.sender === 'object' ? {
    id: p.sender._id || p.sender.id,
    name: p.sender.name,
    email: p.sender.email,
    phone: p.sender.phone,
    profilePhoto: p.sender.profilePhoto,
    bio: p.sender.bio,
    rating: p.sender.rating || 5,
    totalTrips: p.sender.totalTrips || 0,
    adharNumber: p.sender.adharNumber || p.sender.idNumber,
    vehicleType: p.sender.vehicleType,
    adharPhoto: p.sender.idPhoto
  } : undefined,
  travellerData: p.traveller && typeof p.traveller === 'object' ? {
    id: p.traveller._id || p.traveller.id,
    name: p.traveller.name,
    email: p.traveller.email,
    phone: p.traveller.phone,
    profilePhoto: p.traveller.profilePhoto,
    bio: p.traveller.bio,
    rating: p.traveller.rating || 5,
    totalTrips: p.traveller.totalTrips || 0,
    adharNumber: p.traveller.adharNumber || p.traveller.idNumber,
    vehicleType: p.traveller.vehicleType,
    adharPhoto: p.traveller.idPhoto
  } : undefined
  };
};

export const createParcel = async (parcelData: Omit<Parcel, 'id' | 'status' | 'createdAt'>, photoFile?: File | null) => {
  let photoData = "";
  if (photoFile) {
    photoData = await fileToBase64(photoFile);
  }

  const res = await api.post('/parcels', {
    ...parcelData,
    parcelPhoto: photoData
  });
  return mapParcel(res.data);
};

export const simulatePayment = async (id: string, customPriceObj?: any) => {
  const res = await api.post(`/parcels/${id}/simulate-payment`, customPriceObj || {});
  return mapParcel(res.data);
};

export async function updateParcel(id: string, updates: Partial<Omit<Parcel, 'id' | 'status' | 'createdAt'>>, photo?: File): Promise<Parcel> {
  let photoData = updates.parcelPhoto || "";

  if (photo) {
    photoData = await fileToBase64(photo);
  }

  const { data } = await api.put(`/parcels/${id}`, {
    ...updates,
    parcelPhoto: photoData,
  });

  return mapParcel(data);
}

export async function getParcelById(id: string): Promise<Parcel | null> {
  try {
    const { data } = await api.get(`/parcels/id/${id}`);
    return mapParcel(data);
  } catch (err) {
    console.error("Fetch parcel failed:", err);
    return null;
  }
}

export async function getAllParcels(mode?: 'sender' | 'search' | 'receiver'): Promise<Parcel[]> {
  const url = mode ? `/parcels?mode=${mode}` : '/parcels';
  const { data } = await api.get(url);
  return data.map(mapParcel);
}

export async function getMyDeliveries(): Promise<Parcel[]> {
  const { data } = await api.get('/parcels/mydeliveries');
  return data.map(mapParcel);
}

export async function getParcelsByPhone(phone: string): Promise<Parcel[]> {
  const { data } = await api.get(`/parcels/byphone/${encodeURIComponent(phone)}`);
  return data.map(mapParcel);
}

export async function updateParcelStatus(id: string, status: ParcelStatus, travellerName?: string, otp?: string, photo?: File): Promise<Parcel | null> {
  let photoData = "";
  if (photo) {
    photoData = await fileToBase64(photo);
  }
  const { data } = await api.put(`/parcels/${id}/status`, { status, travellerName, otp, deliveryPhoto: photoData });
  return mapParcel(data);
}

export async function markReceived(id: string, photo?: File, rating?: number): Promise<Parcel | null> {
  let photoData = "";
  if (photo) {
    photoData = await fileToBase64(photo);
  }
  
  const { data } = await api.put(`/parcels/${id}/status`, { 
    status: 'received', 
    receivedPhoto: photoData, 
    receiverRating: rating 
  });
  return mapParcel(data);
}

export async function updateParcelPayment(id: string, status: 'paid' | 'unpaid'): Promise<Parcel | null> {
  const { data } = await api.put(`/parcels/${id}/payment`, { status });
  return mapParcel(data);
}

export async function requestParcel(id: string, travellerName: string): Promise<Parcel | null> {
  return updateParcelStatus(id, 'requested', travellerName);
}

export async function acceptRequest(id: string): Promise<Parcel | null> {
  return updateParcelStatus(id, 'accepted');
}

export async function deleteParcel(id: string): Promise<boolean> {
  try {
    await api.delete(`/parcels/${id}`);
    return true;
  } catch (err) {
    console.error("Delete failed:", err);
    return false;
  }
}

export async function releaseParcelPayment(id: string): Promise<Parcel | null> {
  const { data } = await api.put(`/parcels/${id}/release-payment`);
  return mapParcel(data);
}

export async function generateDeliveryOtp(id: string): Promise<{ otp: string, expiry: string } | null> {
  const { data } = await api.post(`/parcels/${id}/generate-delivery-otp`);
  return data;
}

export async function searchParcels(from?: string, to?: string, search?: string): Promise<Parcel[]> {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  if (search) params.append('search', search);
  
  const { data } = await api.get(`/parcels?${params.toString()}`);
  return data.map(mapParcel);
}

export async function submitReview(parcelId: string, revieweeId: string, rating: number, comment: string) {
  const { data } = await api.post('/reviews', {
    parcel: parcelId,
    reviewee: revieweeId,
    rating,
    comment
  });
  return data;
}

