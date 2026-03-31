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
  adharNumber?: string;
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
    senderId: p.senderId,
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
    escrow_status: p.escrow_status,
    distance: p.distance || 0,
    price: p.price || 0,
    parcelCharge: p.parcelCharge,
    platformFee: p.platformFee,
    description: p.description,
    status: p.status,
    travellerId: p.travellerId,
    travellerName: p.travellerName,
    travellerPhone: p.travellerPhone,
    pickupOtp: p.pickupOtp,
    deliveryOtp: p.deliveryOtp,
    paymentReleased: p.paymentReleased,
    parcelPhoto: p.parcelPhoto,
    deliveryPhoto: p.deliveryPhoto,
    receivedPhoto: p.receivedPhoto,
    receiverRating: p.receiverRating,
    createdAt: p.created_at || p.createdAt,
    updatedAt: p.updated_at || p.updatedAt,
    senderData: p.profiles_sender ? {
      id: p.profiles_sender.id,
      name: p.profiles_sender.name,
      email: p.profiles_sender.email,
      phone: p.profiles_sender.phone,
      profilePhoto: p.profiles_sender.profilePhoto,
      rating: p.profiles_sender.rating || 5,
      totalTrips: p.profiles_sender.totalTrips || 0
    } : undefined,
    travellerData: p.profiles_traveller ? {
      id: p.profiles_traveller.id,
      name: p.profiles_traveller.name,
      email: p.profiles_traveller.email,
      phone: p.profiles_traveller.phone,
      profilePhoto: p.profiles_traveller.profilePhoto,
      rating: p.profiles_traveller.rating || 5,
      totalTrips: p.profiles_traveller.totalTrips || 0
    } : undefined
  };
};

export const createParcel = async (parcelData: Omit<Parcel, 'id' | 'status' | 'createdAt'>, photoBase64?: string) => {
  const { data, error } = await supabase
    .from('parcels')
    .insert({
      ...parcelData,
      status: 'pending_payment',
      parcelPhoto: photoBase64
    })
    .select()
    .single();

  if (error) throw error;
  return mapParcel(data);
};

export const simulatePayment = async (id: string) => {
  // Logic: Set paymentStatus to paid and status to open_for_travellers
  const { data, error } = await supabase
    .from('parcels')
    .update({ 
      paymentStatus: 'paid', 
      status: 'open_for_travellers',
      deliveryOtp: Math.floor(100000 + Math.random() * 900000).toString() // Generate OTP on payment
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapParcel(data);
};

export async function updateParcel(id: string, updates: Partial<Parcel>, photoBase64?: string): Promise<Parcel> {
  const { data, error } = await supabase
    .from('parcels')
    .update({
      ...updates,
      parcelPhoto: photoBase64 || updates.parcelPhoto
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapParcel(data);
}

export async function getParcelById(id: string): Promise<Parcel | null> {
  const { data, error } = await supabase
    .from('parcels')
    .select('*, profiles_sender:senderId(*), profiles_traveller:travellerId(*)')
    .eq('id', id)
    .single();

  if (error) return null;
  return mapParcel(data);
}

export async function getAllParcels(mode?: 'sender' | 'search' | 'receiver'): Promise<Parcel[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase.from('parcels').select('*, profiles_sender:senderId(*), profiles_traveller:travellerId(*)');

  if (mode === 'sender') {
    query = query.eq('senderId', user.id);
  } else if (mode === 'receiver') {
    const { data: profile } = await supabase.from('profiles').select('phone').eq('id', user.id).single();
    if (profile?.phone) {
      query = query.eq('receiverPhone', profile.phone);
    } else {
      return [];
    }
  } else if (mode === 'search') {
    query = query.eq('status', 'open_for_travellers').neq('senderId', user.id);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapParcel);
}

export async function getMyDeliveries(): Promise<Parcel[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('parcels')
    .select('*, profiles_sender:senderId(*), profiles_traveller:travellerId(*)')
    .eq('travellerId', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapParcel);
}

export async function updateParcelStatus(id: string, status: ParcelStatus, travellerName?: string, otp?: string, photoBase64?: string): Promise<Parcel | null> {
  const updateData: any = { status };
  const { data: { user } } = await supabase.auth.getUser();

  if (status === 'requested' && user) {
    updateData.travellerId = user.id;
    updateData.travellerName = travellerName;
  }
  
  if (photoBase64) {
    if (status === 'delivered') updateData.deliveryPhoto = photoBase64;
    if (status === 'received') updateData.receivedPhoto = photoBase64;
  }

  const { data, error } = await supabase
    .from('parcels')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapParcel(data);
}

export async function markReceived(id: string, photoBase64?: string, rating?: number): Promise<Parcel | null> {
  return updateParcelStatus(id, 'received', undefined, undefined, photoBase64);
}

export async function updateParcelPayment(id: string, status: 'paid' | 'unpaid'): Promise<Parcel | null> {
  const { data, error } = await supabase
    .from('parcels')
    .update({ paymentStatus: status })
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
    .update({ escrow_status: 'released', paymentReleased: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return mapParcel(data);
}

export async function searchParcels(from?: string, to?: string, search?: string): Promise<Parcel[]> {
  let query = supabase.from('parcels').select('*, profiles_sender:senderId(*), profiles_traveller:travellerId(*)').eq('status', 'open_for_travellers');

  if (from) query = query.ilike('fromLocation', `%${from}%`);
  if (to) query = query.ilike('toLocation', `%${to}%`);
  if (search) query = query.or(`description.ilike.%${search}%,receiverName.ilike.%${search}%`);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapParcel);
}

export async function submitReview(parcelId: string, revieweeId: string, rating: number, comment: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      parcelId,
      reviewerId: user?.id,
      revieweeId,
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
