import api from "./api";
import axios from 'axios';
import { supabase } from "./supabaseClient";

export type ParcelStatus = 'pending_payment' | 'open_for_travellers' | 'pending' | 'requested' | 'accepted' | 'picked-up' | 'in-transit' | 'arrived' | 'delivered' | 'received' | 'completed' | 'cancelled';

export interface UserData {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  bio?: string;
  rating: number;
  totalTrips: number;
  aadharNumber?: string;
  vehicleType?: string;
  aadharPhoto?: string;
  personalOtp?: string;
  personalOtpExpiresAt?: string;
  personalOtpUsed?: boolean;
}

export interface Parcel {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_phone?: string;
  receiver_name: string;
  receiver_phone: string;
  from_location: string;
  to_location: string;
  weight: number;
  size: 'small' | 'medium' | 'large' | 'very-large';
  item_count: number;
  city?: string;
  village?: string;
  vehicle_type?: string;
  payment_method: 'pay-now' | 'pay-on-delivery';
  payment_status: 'pending' | 'unpaid' | 'paid' | 'failed';
  escrow_status?: 'held' | 'released' | 'none';
  distance: number;
  price?: number;
  parcel_charge?: number;
  platform_fee?: number;
  description: string;
  status: ParcelStatus;
  traveller_id?: string;
  traveller_name?: string;
  traveller_phone?: string;
  traveller_aadhar_number?: string;
  traveller_aadhar_photo?: string;
  traveller_photo?: string;
  pickup_otp?: string;
  delivery_otp?: string;
  payment_released?: boolean;
  parcel_photo?: string;
  pickup_photo?: string;
  delivery_photo?: string;
  received_photo?: string;
  receiver_rating?: number;
  created_at: string;
  updated_at?: string;
  sender_data?: UserData;
  traveller_data?: UserData;
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
export const mapParcel = (p: any): Parcel => {
  if (!p) return {} as Parcel;
  return {
    id: p.id || p._id,
    sender_id: p.sender_id || p.sender,
    sender_name: p.sender_name || p.senderName,
    sender_phone: p.sender_phone || p.senderPhone,
    receiver_name: p.receiver_name || p.receiverName,
    receiver_phone: p.receiver_phone || p.receiverPhone,
    from_location: p.from_location || p.fromLocation,
    to_location: p.to_location || p.toLocation,
    weight: p.weight,
    size: p.size,
    item_count: p.item_count || p.itemCount,
    city: p.city,
    village: p.village,
    vehicle_type: p.vehicle_type || p.vehicleType,
    payment_method: p.payment_method || p.paymentMethod,
    payment_status: p.payment_status || p.paymentStatus,
    escrow_status: p.escrow_status,
    distance: p.distance || 0,
    price: p.price || 0,
    parcel_charge: p.parcel_charge || p.parcelCharge,
    platform_fee: p.platform_fee || p.platformFee,
    description: p.description,
    status: p.status,
    traveller_id: p.traveller_id || p.traveller,
    traveller_name: p.traveller_name || p.travellerName,
    traveller_phone: p.traveller_phone || p.travellerPhone,
    traveller_aadhar_number: p.traveller_aadhar_number || p.travellerAadharNumber,
    traveller_aadhar_photo: p.traveller_aadhar_photo || p.travellerAadharPhoto,
    traveller_photo: p.traveller_photo || p.travellerPhoto,
    pickup_otp: p.pickup_otp || p.pickupOtp,
    delivery_otp: p.delivery_otp || p.deliveryOtp,
    payment_released: p.payment_released || p.paymentReleased,
    parcel_photo: p.parcel_photo || p.parcelPhoto,
    pickup_photo: p.pickup_photo || p.pickupPhoto,
    delivery_photo: p.delivery_photo || p.deliveryPhoto || p.delivery_proof,
    received_photo: p.received_photo || p.receivedPhoto,
    receiver_rating: p.receiver_rating || p.receiverRating,
    created_at: p.created_at || p.createdAt,
    updated_at: p.updated_at || p.updatedAt,
    sender_data: (p.sender_id && typeof p.sender_id === 'object') ? p.sender_id : (p.sender && typeof p.sender === 'object') ? p.sender : undefined,
    traveller_data: (p.traveller_id && typeof p.traveller_id === 'object') ? p.traveller_id : (p.traveller && typeof p.traveller === 'object') ? p.traveller : undefined
  };
};

export const createParcel = async (parcel_data: Omit<Parcel, 'id' | 'status' | 'created_at'>, photoFile?: File | null) => {
  let photoData = "";
  if (photoFile) {
    photoData = await fileToBase64(photoFile);
  }

  const res = await api.post('/parcels', {
    ...parcel_data,
    parcel_photo: photoData
  });
  return mapParcel(res.data);
};

export const simulatePayment = async (id: string, customPriceObj?: any) => {
  const res = await api.post(`/parcels/${id}/simulate-payment`, customPriceObj || {});
  return mapParcel(res.data);
};

export async function updateParcel(id: string, updates: Partial<Omit<Parcel, 'id' | 'status' | 'created_at'>>, photo?: File): Promise<Parcel> {
  let photoData = updates.parcel_photo || "";

  if (photo) {
    photoData = await fileToBase64(photo);
  }

  const { data } = await api.put(`/parcels/${id}`, {
    ...updates,
    parcel_photo: photoData,
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
  try {
    const url = mode ? `/parcels?mode=${mode}` : '/parcels';
    const { data } = await api.get(url);
    return data.map(mapParcel);
  } catch (err: any) {
    console.error(`[Parcel Store] getAllParcels failed for mode: ${mode}`, err.response?.data?.message || err.message);
    throw err;
  }
}

export async function getMyDeliveries(): Promise<Parcel[]> {
  const { data } = await api.get('/parcels/mydeliveries');
  return data.map(mapParcel);
}

export async function getParcelsByPhone(phone: string): Promise<Parcel[]> {
  const { data } = await api.get(`/parcels/byphone/${encodeURIComponent(phone)}`);
  return data.map(mapParcel);
}

export async function updateParcelStatus(id: string, status: ParcelStatus, travellerName?: string, otp?: string, photo?: string): Promise<Parcel | null> {
  const { data } = await api.put(`/parcels/${id}/status`, { 
    status, 
    travellerName, 
    otp, 
    pickup_photo: photo,
    deliveryPhoto: photo // fallback for compatibility
  });
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

// 📡 SUPABASE REALTIME SUBSCRIPTIONS
export const subscribeToParcel = (parcelId: string, callback: (payload: any) => void) => {
  console.log(`[Realtime] Subscribing to parcel: ${parcelId}`);
  return supabase
    .channel(`parcel-changes-${parcelId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'parcels',
        filter: `id=eq.${parcelId}`
      },
      (payload) => {
        console.log('[Realtime] Parcel Updated:', payload.new);
        callback(mapParcel(payload.new));
      }
    )
    .subscribe();
};

export const subscribeToMessages = (deliveryId: string, callback: (payload: any) => void) => {
  console.log(`[Realtime] Subscribing to messages for delivery: ${deliveryId}`);
  return supabase
    .channel(`message-changes-${deliveryId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `delivery_id=eq.${deliveryId}`
      },
      (payload) => {
        console.log('[Realtime] New Message:', payload.new);
        callback(payload.new);
      }
    )
    .subscribe();
};

export const uploadParcelPhoto = async (parcelId: string, file: File, type: 'pickup' | 'delivery' = 'delivery') => {
  const fileExt = file.name.split('.').pop();
  const filePath = `${parcelId}/${type}_${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('parcel-images')
    .upload(filePath, file);

  if (error) {
    console.error(`[Storage] Upload failed:`, error.message);
    throw error;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('parcel-images')
    .getPublicUrl(filePath);

  return publicUrl;
};

