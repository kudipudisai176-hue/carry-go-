import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key. Check your .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const seedSupabase = async () => {
  try {
    console.log('Connecting to Supabase for seeding...');

    const apCities = [
      { name: "Rajahmundry", village: "Danavaipeta" },
      { name: "Visakhapatnam", village: "Gajuwaka" },
      { name: "Vijayawada", village: "Patamata" },
      { name: "Guntur", village: "Tenali" },
      { name: "Nellore", village: "Kavali" },
      { name: "Kurnool", village: "Nandyal" },
      { name: "Tirupati", village: "Chandragiri" }
    ];

    // Note: This requires a 'parcels' table in Supabase
    // To seed successfully, we need a valid senderId (UUID) 
    // This script assumes you have at least one user registered.
    
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .limit(1)
      .single();

    if (userError || !userData) {
      console.error('No users found in profiles table. Please sign up at least one user first.');
      process.exit(1);
    }

    const parcels = apCities.map(city => ({
      senderId: userData.id,
      senderName: userData.name,
      senderPhone: userData.phone,
      receiverName: "Supabase Receiver",
      receiverPhone: "+919876543210",
      fromLocation: city.name,
      toLocation: "Hyderabad, TS",
      weight: 2.5,
      size: "medium",
      itemCount: 1,
      vehicleType: "bike",
      price: 1350,
      paymentMethod: "pay-now",
      paymentStatus: "paid",
      description: `Urgent delivery from ${city.village}, ${city.name} (Seeded via Supabase)`,
      status: "pending"
    }));

    // Clear existing pending parcels
    const { error: deleteError } = await supabase
      .from('parcels')
      .delete()
      .eq('status', 'pending');

    if (deleteError) console.warn('Error clearing existing parcels:', deleteError.message);

    const { error: insertError } = await supabase
      .from('parcels')
      .insert(parcels);

    if (insertError) throw insertError;

    console.log('Sample parcels seeded successfully to Supabase for AP cities!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Supabase:', error);
    process.exit(1);
  }
};

seedSupabase();
