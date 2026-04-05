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
  idPhoto?: string;
  personalOtp?: string;
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
  paymentStatus: 'pending' | 'unpaid' | 'paid' | 'failed';
  escrow_status?: 'held' | 'released' | 'none';
  distance: number;
  price?: number;
  parcelCharge?: number;
  platformFee?: number;
  description: string;
  status: ParcelStatus;
  travellerId?: string;
  travellerName?: string;
  travellerPhone?: string;
  pickupOtp?: string;
  deliveryOtp?: string;
  paymentReleased?: boolean;
  parcelPhoto?: string;
  deliveryPhoto?: string;
  receivedPhoto?: string;
  receiverRating?: number;
  createdAt: string;
  updatedAt?: string;
  senderData?: UserData;
  travellerData?: UserData;
}

// Helper to map DB columns to Frontend interface
export const mapParcel = (p: any): Parcel => {
  if (!p) return {} as Parcel;
  return {
    id: p.id,
    senderId: p.sender_id || p.senderId,
    senderName: p.sender_name || p.senderName,
    senderPhone: p.sender_phone || p.senderPhone,
    receiverName: p.receiver_name || p.receiverName,
    receiverPhone: p.receiver_phone || p.receiverPhone,
    fromLocation: p.from_location || p.fromLocation,
    toLocation: p.to_location || p.toLocation,
    weight: p.weight,
    size: p.size,
    itemCount: p.item_count || p.itemCount,
    city: p.city,
    village: p.village,
    vehicleType: p.vehicle_type || p.vehicleType,
    paymentMethod: p.payment_method || p.paymentMethod,
    paymentStatus: p.payment_status || p.paymentStatus,
    escrow_status: p.escrow_status,
    distance: p.distance || 0,
    price: p.price || 0,
    parcelCharge: p.parcel_charge || p.parcelCharge,
    platformFee: p.platform_fee || p.platformFee,
    description: p.description,
    status: p.status,
    travellerId: p.traveller_id || p.travellerId,
    travellerName: p.traveller_name || p.travellerName,
    travellerPhone: p.traveller_phone || p.travellerPhone,
    pickupOtp: p.pickup_otp || p.pickupOtp,
    deliveryOtp: p.delivery_otp || p.deliveryOtp,
    paymentReleased: p.payment_released || p.paymentReleased,
    parcelPhoto: p.parcel_photo || p.parcelPhoto,
    deliveryPhoto: p.delivery_photo || p.deliveryPhoto,
    receivedPhoto: p.received_photo || p.receivedPhoto,
    receiverRating: p.receiver_rating || p.receiverRating,
    createdAt: p.created_at || p.createdAt,
    updatedAt: p.updated_at || p.updatedAt,
    senderData: (p.senderData || p.users_sender) ? {
      id: (p.senderData || p.users_sender).id,
      name: (p.senderData || p.users_sender).name,
      email: (p.senderData || p.users_sender).email,
      phone: (p.senderData || p.users_sender).phone,
      profilePhoto: (p.senderData || p.users_sender).profile_photo,
      rating: (p.senderData || p.users_sender).rating || 5,
      totalTrips: (p.senderData || p.users_sender).total_trips || 0
    } : undefined,
    travellerData: (p.travellerData || p.users_traveller) ? {
      id: (p.travellerData || p.users_traveller).id,
      name: (p.travellerData || p.users_traveller).name,
      email: (p.travellerData || p.users_traveller).email,
      phone: (p.travellerData || p.users_traveller).phone,
      profilePhoto: (p.travellerData || p.users_traveller).profile_photo,
      rating: (p.travellerData || p.users_traveller).rating || 5,
      totalTrips: (p.travellerData || p.users_traveller).total_trips || 0
    } : undefined
  };
};


// Helper to map Frontend interface to DB columns
export const unmapParcel = (p: Partial<Parcel>): any => {
  const data: any = {};
  if (p.senderId !== undefined) data.sender_id = p.senderId;
  if (p.senderName !== undefined) data.sender_name = p.senderName;
  if (p.senderPhone !== undefined) data.sender_phone = p.senderPhone;
  if (p.receiverName !== undefined) data.receiver_name = p.receiverName;
  if (p.receiverPhone !== undefined) data.receiver_phone = p.receiverPhone;
  if (p.fromLocation !== undefined) data.from_location = p.fromLocation;
  if (p.toLocation !== undefined) data.to_location = p.toLocation;
  if (p.weight !== undefined) data.weight = p.weight;
  if (p.size !== undefined) data.size = p.size;
  if (p.itemCount !== undefined) data.item_count = p.itemCount;
  if (p.city !== undefined) data.city = p.city;
  if (p.village !== undefined) data.village = p.village;
  if (p.vehicleType !== undefined) data.vehicle_type = p.vehicleType;
  if (p.paymentMethod !== undefined) data.payment_method = p.paymentMethod;
  if (p.paymentStatus !== undefined) data.payment_status = p.paymentStatus;
  if (p.description !== undefined) data.description = p.description;
  if (p.status !== undefined) data.status = p.status;
  if (p.travellerId !== undefined) data.traveller_id = p.travellerId;
  if (p.travellerName !== undefined) data.traveller_name = p.travellerName;
  if (p.travellerPhone !== undefined) data.traveller_phone = p.travellerPhone;
  if (p.pickupOtp !== undefined) data.pickup_otp = p.pickupOtp;
  if (p.deliveryOtp !== undefined) data.delivery_otp = p.deliveryOtp;
  if (p.parcelPhoto !== undefined) data.parcel_photo = p.parcelPhoto;
  if (p.deliveryPhoto !== undefined) data.delivery_photo = p.deliveryPhoto;
  if (p.receivedPhoto !== undefined) data.received_photo = p.receivedPhoto;
  if (p.price !== undefined) data.price = p.price;
  if (p.distance !== undefined) data.distance = p.distance;
  return data;
};


import axios from "axios";

const BACKEND_URL = '/api';

// Create an axial instance with a base URL
const api = axios.create({
  baseURL: BACKEND_URL,
});

// Add an interceptor to automatically add the Supabase token to every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// 🛡️ REBOOT RESILIENCE: Improved Retry Helper for Network and Lock Conflicts
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const isLockError = err?.message?.toLowerCase().includes('lock broken') || err?.code === 'PGRST116';
    const isNetworkError = !err.response && err.request;
    
    if (retries > 0 && (isLockError || isNetworkError)) {
      console.warn(`[Retry Hub] Retrying operation (${retries} left) due to: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

export const createParcel = async (parcelData: Omit<Parcel, 'id' | 'status' | 'createdAt'>, photoBase64?: string) => {
  return withRetry(async () => {
    const resp = await api.post('/parcels', {
      ...parcelData,
      parcel_photo: photoBase64
    });
    return mapParcel(resp.data);
  });
};

export const simulatePayment = async (id: string): Promise<Parcel> => {
  return withRetry(async () => {
    const resp = await api.post(`/parcels/${id}/simulate-payment`);
    return mapParcel(resp.data);
  });
};

export async function updateParcel(id: string, updates: Partial<Parcel>, photoBase64?: string): Promise<Parcel | null> {
  return withRetry(async () => {
    const response = await api.put(`/parcels/${id}`, {
      ...updates,
      photoBase64
    });
    return mapParcel(response.data);
  });
}

export async function getParcelById(id: string): Promise<Parcel | null> {
  const { data, error } = await supabase
    .from('parcels')
    .select('*, users_sender:sender_id(*), users_traveller:traveller_id(*)')
    .eq('id', id)
    .single();

  if (error) return null;
  return mapParcel(data);
}

export async function getAllParcels(mode?: 'sender' | 'search' | 'receiver'): Promise<Parcel[]> {
  return withRetry(async () => {
    const response = await api.get('/parcels', { params: { mode } });
    return (response.data || []).map(mapParcel);
  });
}

export async function getMyDeliveries(): Promise<Parcel[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('parcels')
    .select('*, users_sender:sender_id(*), users_traveller:traveller_id(*)')
    .eq('traveller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapParcel);
}

export async function updateParcelStatus(id: string, status: ParcelStatus, travellerName?: string, otp?: string, photoBase64?: string): Promise<Parcel | null> {
  return withRetry(async () => {
    const response = await api.put(`/parcels/${id}/status`, {
      status,
      traveller_name: travellerName,
      otp,
      photoBase64
    });
    return mapParcel(response.data);
  });
}

export async function markReceived(id: string, photoBase64?: string, rating?: number): Promise<Parcel | null> {
  return updateParcelStatus(id, 'received', undefined, undefined, photoBase64);
}

export async function updateParcelPayment(id: string, status: 'paid' | 'unpaid'): Promise<Parcel | null> {
  const { data, error } = await supabase
    .from('parcels')
    .update({ payment_status: status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapParcel(data);
}

export async function deleteParcel(id: string): Promise<boolean> {
  const { error } = await supabase.from('parcels').delete().eq('id', id);
  return !error;
}

export async function releaseParcelPayment(id: string): Promise<Parcel | null> {
  const { data, error } = await supabase
    .from('parcels')
    .update({ escrow_status: 'released', payment_released: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapParcel(data);
}

export async function searchParcels(from?: string, to?: string, search?: string): Promise<Parcel[]> {
  let query = supabase.from('parcels').select('*, users_sender:sender_id(*), users_traveller:traveller_id(*)').eq('status', 'open_for_travellers');

  if (from) query = query.ilike('from_location', `%${from}%`);
  if (to) query = query.ilike('to_location', `%${to}%`);
  if (search) query = query.or(`description.ilike.%${search}%,receiver_name.ilike.%${search}%`);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapParcel);
}

export async function submitReview(parcelId: string, revieweeId: string, rating: number, comment: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      parcel_id: parcelId,
      reviewer_id: user?.id,
      reviewee_id: revieweeId,
      rating,
      comment
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// 📡 SUPABASE REALTIME SUBSCRIPTIONS
export const subscribeToParcel = (parcelId: string, callback: (payload: any) => void) => {
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
        callback(mapParcel(payload.new));
      }
    )
    .subscribe();
};

export const subscribeToMessages = (deliveryId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`message-changes-${deliveryId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `deliveryId=eq.${deliveryId}`
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
};

export async function requestParcel(id: string, travellerName: string) {
  return updateParcelStatus(id, 'requested', travellerName);
}

export async function acceptRequest(id: string) {
  return updateParcelStatus(id, 'accepted');
}

export async function getParcelsByPhone(phone: string): Promise<Parcel[]> {
  const { data, error } = await supabase
    .from('parcels')
    .select('*, users_sender:sender_id(*), users_traveller:traveller_id(*)')
    .eq('receiver_phone', phone)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapParcel);
}

export async function uploadParcelPhoto(id: string, file: File, type: 'pickup' | 'delivery' | 'received'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export async function generateDeliveryOtp(id: string) {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  await supabase
    .from('parcels')
    .update({ delivery_otp: otp })
    .eq('id', id);
  return { otp };
}


