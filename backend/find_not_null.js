require('dotenv').config({ path: __dirname + '/.env' });
const { supabase } = require('./config/db');

async function test() {
  const { data, error } = await supabase.rpc('get_not_null_columns', { tbl_name: 'parcels' });
  if (error) {
    // If RPC fails, try a direct query via maybe another way or just try to get all cols and see which ones are missing in a failed insert
    console.error('RPC failed:', error);
  } else {
    console.log('Not Null Columns:', data);
  }
}

test();
