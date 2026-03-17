import { supabase } from "./supabaseClient";

export type ParcelStatus = 'pending' | 'requested' | 'accepted' | 'picked-up' | 'in-transit' | 'delivered' | 'received' | 'completed' | 'cancelled';

export interface UserData {
  id: string;
  name: string;
  profilePhoto?: string;
  bio?: string;
  rating: number;
  totalTrips: number;
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
  vehicleType?: string;
  paymentMethod: 'pay-now' | 'pay-on-delivery';
  paymentStatus: 'unpaid' | 'paid';
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
  createdAt: string;
  senderData?: UserData;
  travellerData?: UserData;
}

// Helper to map DB columns to Frontend interface
const mapParcel = (p: any): Parcel => ({
  id: p.id,
  senderId: p.sender_id,
  senderName: p.sender_name,
  senderPhone: p.sender_phone,
  receiverName: p.receiver_name,
  receiverPhone: p.receiver_phone,
  fromLocation: p.pickup_location?.address || p.from_location,
  toLocation: p.delivery_location?.address || p.to_location,
  weight: p.weight,
  size: p.size,
  itemCount: p.item_count,
  vehicleType: p.vehicle_type,
  paymentMethod: p.payment_method,
  paymentStatus: p.payment_status,
  description: p.description,
  status: p.status,
  travellerId: p.traveller_id,
  travellerName: p.traveller_name,
  travellerPhone: p.traveller_phone,
  travellerAdharNumber: p.traveller_adhar_number,
  travellerAdharPhoto: p.traveller_adhar_photo_url,
  travellerPhoto: p.traveller_photo_url,
  pickupOtp: p.pickup_otp,
  deliveryOtp: p.delivery_otp,
  paymentReleased: p.payment_released,
  parcelPhoto: p.parcel_photo_url,
  createdAt: p.created_at,
  senderData: p.profiles_sender ? {
    id: p.profiles_sender.id,
    name: p.profiles_sender.name,
    profilePhoto: p.profiles_sender.profile_photo_url,
    rating: p.profiles_sender.rating || 5,
    totalTrips: p.profiles_sender.total_trips || 0
  } : undefined,
  travellerData: p.profiles_traveller ? {
    id: p.profiles_traveller.id,
    name: p.profiles_traveller.name,
    profilePhoto: p.profiles_traveller.profile_photo_url,
    rating: p.profiles_traveller.rating || 5,
    totalTrips: p.profiles_traveller.total_trips || 0
  } : undefined
});

export async function createParcel(parcel: Omit<Parcel, 'id' | 'status' | 'createdAt'>, photo?: File): Promise<Parcel> {
  let photoUrl = "";

  if (photo) {
    const fileName = `${Date.now()}-${photo.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('parcel-photos')
      .upload(fileName, photo);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('parcel-photos')
      .getPublicUrl(uploadData.path);
    
    photoUrl = publicUrl;
  }

  const { data, error } = await supabase
    .from('parcels')
    .insert([{
      sender_id: parcel.senderId,
      sender_name: parcel.senderName,
      receiver_name: parcel.receiverName,
      receiver_phone: parcel.receiverPhone,
      from_location: parcel.fromLocation,
      to_location: parcel.toLocation,
      weight: parcel.weight,
      size: parcel.size,
      item_count: parcel.itemCount,
      vehicle_type: parcel.vehicleType,
      payment_method: parcel.paymentMethod,
      payment_status: parcel.paymentStatus,
      description: parcel.description,
      parcel_photo_url: photoUrl,
      status: 'pending',
      pickup_otp: Math.floor(1000 + Math.random() * 9000).toString(),
      delivery_otp: Math.floor(1000 + Math.random() * 9000).toString()
    }])
    .select()
    .single();

  if (error) throw error;
  return mapParcel(data);
}

export async function getAllParcels(): Promise<Parcel[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('parcels')
    .select(`
      *,
      profiles_sender:profiles!sender_id(*),
      profiles_traveller:profiles!traveller_id(*)
    `)
    .eq('sender_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapParcel);
}

export async function getMyDeliveries(): Promise<Parcel[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('parcels')
    .select(`
      *,
      profiles_sender:profiles!sender_id(*),
      profiles_traveller:profiles!traveller_id(*)
    `)
    .eq('traveller_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapParcel);
}

export async function getParcelsByPhone(phone: string): Promise<Parcel[]> {
  const { data, error } = await supabase
    .from('parcels')
    .select(`
      *,
      profiles_sender:profiles!sender_id(*),
      profiles_traveller:profiles!traveller_id(*)
    `)
    .eq('receiver_phone', phone)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapParcel);
}

export async function updateParcelStatus(id: string, status: ParcelStatus, travellerName?: string, otp?: string): Promise<Parcel | null> {
  const updateData: any = { status };
  
  if (status === 'requested') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      updateData.traveller_id = user.id;
      updateData.traveller_name = travellerName;
    }
  }

  if (status === 'in-transit' && otp) {
    const { data: parcel } = await supabase.from('parcels').select('pickup_otp').eq('id', id).single();
    if (parcel?.pickup_otp !== otp) {
      throw new Error("Invalid OTP. Please check with the Sender.");
    }
  }

  const { data, error } = await supabase
    .from('parcels')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      profiles_sender:profiles!sender_id(*),
      profiles_traveller:profiles!traveller_id(*)
    `)
    .single();

  if (error) throw error;
  return mapParcel(data);
}

export async function markReceived(id: string): Promise<Parcel | null> {
  return updateParcelStatus(id, 'received');
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

export async function requestParcel(id: string, travellerName: string): Promise<Parcel | null> {
  return updateParcelStatus(id, 'requested', travellerName);
}

export async function acceptRequest(id: string): Promise<Parcel | null> {
  return updateParcelStatus(id, 'accepted');
}

export async function deleteParcel(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('parcels')
    .delete()
    .eq('id', id);

  return !error;
}

export async function releaseParcelPayment(id: string): Promise<Parcel | null> {
  const { data: parcel, error: getError } = await supabase
    .from('parcels')
    .select('*, profiles_traveller:profiles!traveller_id(*)')
    .eq('id', id)
    .single();

  if (getError) throw getError;
  if (!parcel.traveller_id) return null;

  // Transaction for updating payment status and traveller wallet
  const { error: updateError } = await supabase
    .from('parcels')
    .update({ payment_released: true, status: 'completed' })
    .eq('id', id);

  if (updateError) throw updateError;

  const currentBalance = parcel.profiles_traveller?.wallet_balance || 0;
  const { error: walletError } = await supabase
    .from('profiles')
    .update({ wallet_balance: currentBalance + parcel.price })
    .eq('id', parcel.traveller_id);

  if (walletError) throw walletError;

  return mapParcel({ ...parcel, payment_released: true, status: 'completed' });
}

export async function searchParcels(from?: string, to?: string): Promise<Parcel[]> {
  let query = supabase
    .from('parcels')
    .select(`
      *,
      profiles_sender:profiles!sender_id(*),
      profiles_traveller:profiles!traveller_id(*)
    `)
    .in('status', ['pending', 'requested']);

  if (from) query = query.ilike('from_location', `%${from}%`);
  if (to) query = query.ilike('to_location', `%${to}%`);

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapParcel);
}
