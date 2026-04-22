-- SQL Schema for CarryGo Supabase Database

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'sender_receiver',
  sub_role TEXT DEFAULT 'sender',
  bio TEXT,
  profile_photo TEXT,
  wallet_balance DECIMAL DEFAULT 0,
  rating DECIMAL DEFAULT 5.0,
  total_trips INTEGER DEFAULT 0,
  personal_otp TEXT,
  personal_otp_expires_at TIMESTAMP WITH TIME ZONE,
  personal_otp_used BOOLEAN DEFAULT FALSE,
  vehicle_type TEXT,
  aadhar_number TEXT,
  aadhar_photo TEXT,
  id_photo TEXT,
  live_photo TEXT,
  id_proof_type TEXT,
  id_number TEXT,
  dob TEXT,
  gender TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parcels Table
CREATE TABLE parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  description TEXT,
  from_location TEXT,
  to_location TEXT,
  village TEXT,
  city TEXT,
  weight DECIMAL,
  size TEXT,
  item_count INTEGER DEFAULT 1,
  vehicle_type TEXT,
  parcel_photo TEXT,
  receiver_name TEXT,
  receiver_phone TEXT,
  sender_id UUID REFERENCES users(id),
  sender_name TEXT,
  sender_phone TEXT,
  receiver_id UUID REFERENCES users(id),
  traveller_id UUID REFERENCES users(id),
  traveller_name TEXT,
  traveller_phone TEXT,
  parcel_charge DECIMAL,
  platform_fee DECIMAL,
  price DECIMAL,
  status TEXT DEFAULT 'open_for_travellers',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  escrow_status TEXT,
  pickup_otp TEXT,
  delivery_otp TEXT,
  delivery_otp_expiry TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  payment_released BOOLEAN DEFAULT FALSE,
  pickup_photo TEXT,
  delivery_photo TEXT,
  received_photo TEXT,
  receiver_rating DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES parcels(id),
  sender_id UUID REFERENCES users(id),
  text TEXT,
  image TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES users(id),
  title TEXT,
  message TEXT,
  type TEXT,
  reference_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID REFERENCES parcels(id),
  sender_id UUID REFERENCES users(id),
  amount DECIMAL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES users(id),
  reviewee_id UUID REFERENCES users(id),
  parcel_id UUID REFERENCES parcels(id),
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallets Table
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  balance DECIMAL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_parcels_updated_at BEFORE UPDATE ON parcels FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
