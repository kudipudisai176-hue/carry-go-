require('dotenv').config({ path: __dirname + '/.env' });
const { supabase } = require('./config/db');

async function test() {
  const parcelData = {
    from_location: 'source',
    to_location: 'destination',
    weight: 1,
    size: 'medium',
    status: 'pending',
    sender_id: 'b36cc829-5bed-4461-85b4-3d4b4d3cc15c',
    receiver_name: 'test receiver',
    receiver_phone: '9876543210',
    sender_name: 'test sender',
    sender_phone: '0123456789',
    price: 55,
    parcel_charge: 50,
    platform_fee: 5,
    item_count: 1,
    payment_method: 'pay-now',
    payment_status: 'paid',
    escrow_status: 'none'
  };

  const { data, error } = await supabase.from('parcels').insert(parcelData).select().single();

  if (error) {
    console.error('Error with full snake_case insert:', error);
  } else {
    console.log('Successfully inserted full snake_case parcel:', data);
  }
}

test();
