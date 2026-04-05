require('dotenv').config({ path: __dirname + '/.env' });
const { supabase } = require('./config/db');

async function test() {
  const { data, error } = await supabase.from('parcels').insert({
    from_location: 'source',
    to_location: 'destination',
    weight: 1,
    size: 'medium',
    status: 'pending',
    sender_id: 'b36cc829-5bed-4461-85b4-3d4b4d3cc15c',
    receiver_name: 'test receiver'
  }).select().single();

  if (error) {
    console.error('Error inserting parcel with receiver_name:', error);
  } else {
    console.log('Successfully inserted parcel:', data);
  }
}

test();
