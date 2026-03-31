const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { supabase } = require('./backend/config/db');

async function checkParcels() {
  const { data, error } = await supabase.from('parcels').select('*');
  if (error) {
    console.error('Error fetching parcels:', error);
    return;
  }
  console.log('Total parcels:', data.length);
  data.forEach(p => {
    console.log(`ID: ${p.id}, SenderID: ${p.sender_id}, Status: ${p.status}, PaymentStatus: ${p.payment_status}, CreatedAt: ${p.created_at}`);
  });
}

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('id, name, phone, role, sub_role');
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  console.log('Total users:', data.length);
  data.forEach(u => {
    console.log(`ID: ${u.id}, Name: ${u.name}, Phone: ${u.phone}, Role: ${u.role}, SubRole: ${u.sub_role}`);
  });
}

async function run() {
  await checkParcels();
  console.log('-------------------');
  await checkUsers();
}

run();
