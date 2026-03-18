import api from "./api";

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

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper to map DB columns to Frontend interface
const mapParcel = (p: any): Parcel => ({
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
  vehicleType: p.vehicleType,
  paymentMethod: p.paymentMethod,
  paymentStatus: p.paymentStatus,
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
  createdAt: p.createdAt,
  senderData: p.sender && typeof p.sender === 'object' ? {
    id: p.sender._id || p.sender.id,
    name: p.sender.name,
    profilePhoto: p.sender.profilePhoto,
    rating: p.sender.rating || 5,
    totalTrips: p.sender.totalTrips || 0
  } : undefined,
  travellerData: p.traveller && typeof p.traveller === 'object' ? {
    id: p.traveller._id || p.traveller.id,
    name: p.traveller.name,
    profilePhoto: p.traveller.profilePhoto,
    rating: p.traveller.rating || 5,
    totalTrips: p.traveller.totalTrips || 0
  } : undefined
});

export async function createParcel(parcel: Omit<Parcel, 'id' | 'status' | 'createdAt'>, photo?: File): Promise<Parcel> {
  let photoData = "";

  if (photo) {
    photoData = await fileToBase64(photo);
  }

  const { data } = await api.post('/parcels', {
    ...parcel,
    parcelPhoto: photoData,
  });

  return mapParcel(data);
}

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

export async function getAllParcels(): Promise<Parcel[]> {
  const { data } = await api.get('/parcels');
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

export async function updateParcelStatus(id: string, status: ParcelStatus, travellerName?: string, otp?: string): Promise<Parcel | null> {
  const { data } = await api.put(`/parcels/${id}/status`, { status, travellerName, otp });
  return mapParcel(data);
}

export async function markReceived(id: string): Promise<Parcel | null> {
  return updateParcelStatus(id, 'received');
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

export async function searchParcels(from?: string, to?: string): Promise<Parcel[]> {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  
  const { data } = await api.get(`/parcels?${params.toString()}`);
  return data.map(mapParcel);
}

