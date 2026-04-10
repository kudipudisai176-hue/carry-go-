import axios from "axios";

export type ParcelStatus = 'pending_payment' | 'open_for_travellers' | 'pending' | 'requested' | 'accepted' | 'assigned' | 'picked-up' | 'in-transit' | 'arrived' | 'delivered' | 'received' | 'completed' | 'cancelled';

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
  receiverId?: string;
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

// Helper to map backend data to Frontend interface
// Since we used virtuals in the models, the data should already match mostly.
export const mapParcel = (p: any): Parcel => {
  if (!p) return {} as Parcel;
  return {
    ...p,
    id: p._id || p.id,
    senderId: p.senderId || p.sender_id,
    senderName: p.senderName || p.sender_name,
    senderPhone: p.senderPhone || p.sender_phone,
    receiverId: p.receiverId || p.receiver_id,
    receiverName: p.receiverName || p.receiver_name,
    receiverPhone: p.receiverPhone || p.receiver_phone,
    fromLocation: p.fromLocation || p.from_location,
    toLocation: p.toLocation || p.to_location,
    itemCount: p.itemCount || p.item_count,
    vehicleType: p.vehicleType || p.vehicle_type,
    paymentMethod: p.paymentMethod || p.payment_method,
    paymentStatus: p.paymentStatus || p.payment_status,
    travellerId: p.travellerId || p.traveller_id,
    travellerName: p.travellerName || p.traveller_name,
    travellerPhone: p.travellerPhone || p.traveller_phone,
    pickupOtp: p.pickupOtp || p.pickup_otp,
    deliveryOtp: p.deliveryOtp || p.delivery_otp,
    paymentReleased: p.paymentReleased || p.payment_released,
    parcelPhoto: p.parcelPhoto || p.parcel_photo,
    deliveryPhoto: p.deliveryPhoto || p.delivery_photo,
    receivedPhoto: p.receivedPhoto || p.received_photo,
    receiverRating: p.receiverRating || p.receiver_rating,
    createdAt: p.createdAt || p.created_at,
    updatedAt: p.updatedAt || p.updated_at,
  };
};

const BACKEND_URL = '/api';

// Create an axios instance with a base URL
const api = axios.create({
  baseURL: BACKEND_URL,
});

// Add an interceptor to automatically add the token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🛡️ REBOOT RESILIENCE: Improved Retry Helper for Network and Lock Conflicts
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0 && (!err.response && err.request)) {
      console.warn(`[Retry Hub] Retrying operation (${retries} left) due to network issues`);
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
  return withRetry(async () => {
    const response = await api.get(`/parcels/id/${id}`);
    return mapParcel(response.data);
  });
}

export async function getAllParcels(mode?: 'sender' | 'search' | 'receiver'): Promise<Parcel[]> {
  return withRetry(async () => {
    const response = await api.get('/parcels', { params: { mode } });
    return (response.data || []).map(mapParcel);
  });
}

export async function getMyDeliveries(): Promise<Parcel[]> {
  return withRetry(async () => {
    const response = await api.get('/parcels/mydeliveries');
    return (response.data || []).map(mapParcel);
  });
}

export async function updateParcelStatus(id: string, status: ParcelStatus, travellerName?: string, otp?: string, photoBase64?: string): Promise<Parcel | null> {
  return withRetry(async () => {
    const body: Record<string, any> = {
      status,
      traveller_name: travellerName,
      otp,
    };

    // Send photo under the correct field name the backend expects
    if (photoBase64) {
      if (status === 'delivered') {
        body.delivery_photo = photoBase64;
        body.deliveryPhoto = photoBase64;
      } else if (status === 'picked-up' || status === 'in-transit') {
        body.pickup_photo = photoBase64;
        body.pickupPhoto = photoBase64;
      } else if (status === 'received') {
        body.received_photo = photoBase64;
        body.receivedPhoto = photoBase64;
      } else {
        body.photoBase64 = photoBase64;
      }
    }

    const response = await api.put(`/parcels/${id}/status`, body);
    return mapParcel(response.data);
  });
}

export async function markReceived(id: string, photoBase64?: string, rating?: number): Promise<Parcel | null> {
  return updateParcelStatus(id, 'received', undefined, undefined, photoBase64);
}

export async function updateParcelPayment(id: string, status: 'paid' | 'unpaid'): Promise<Parcel | null> {
  return withRetry(async () => {
    const response = await api.put(`/parcels/${id}/payment`, { status });
    return mapParcel(response.data);
  });
}

export async function deleteParcel(id: string): Promise<boolean> {
  return withRetry(async () => {
    await api.delete(`/parcels/${id}`);
    return true;
  });
}

export async function releaseParcelPayment(id: string): Promise<Parcel | null> {
  return withRetry(async () => {
    const response = await api.put(`/parcels/${id}/release-payment`);
    return mapParcel(response.data);
  });
}

export async function searchParcels(from?: string, to?: string, search?: string): Promise<Parcel[]> {
  return withRetry(async () => {
    const response = await api.get('/parcels', { params: { from, to, search, mode: 'search' } });
    return (response.data || []).map(mapParcel);
  });
}

export async function submitReview(parcelId: string, revieweeId: string, rating: number, comment: string) {
  return withRetry(async () => {
    const response = await api.post('/reviews', {
      parcel: parcelId,
      reviewee: revieweeId,
      rating,
      comment
    });
    return response.data;
  });
}

// 📡 Realtime placeholders — can be replaced with Socket.io later.
export const subscribeToParcel = (_parcelId: string, _callback: (payload: any) => void) => {
  return { unsubscribe: () => {} };
};

export const subscribeToMessages = (_deliveryId: string, _callback: (payload: any) => void) => {
  return { unsubscribe: () => {} };
};

export async function requestParcel(id: string, travellerName: string) {
  return updateParcelStatus(id, 'requested', travellerName);
}

export async function acceptRequest(id: string) {
  return updateParcelStatus(id, 'accepted');
}

export async function getParcelsByPhone(phone: string): Promise<Parcel[]> {
  return withRetry(async () => {
    const response = await api.get(`/parcels/byphone/${phone}`);
    return (response.data || []).map(mapParcel);
  });
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
  return withRetry(async () => {
    const response = await api.post(`/parcels/${id}/generate-delivery-otp`);
    return response.data;
  });
}
