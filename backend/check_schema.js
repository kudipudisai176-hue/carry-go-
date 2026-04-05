require('dotenv').config({ path: __dirname + '/.env' });
const { supabase } = require('./config/db');

async function test() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'parcels' });
  if (error) {
    // If RPC doesn't exist, try selecting one row and looking at keys
    const { data: d, error: e } = await supabase.from('parcels').select('*').limit(1);
    if (e) {
      console.error('Error fetching parcels:', e);
    } else if (d && d.length > 0) {
      console.log('Columns:', Object.keys(d[0]));
    } else {
      console.log('No parcels found and RPC failed.');
    }
  } else {
    console.log('Schema:', data);
  }
}

test();
