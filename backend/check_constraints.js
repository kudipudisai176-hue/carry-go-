require('dotenv').config({ path: __dirname + '/.env' });
const { supabase } = require('./config/db');

async function test() {
  // Query to get NOT NULL columns for parcels table
  const { data, error } = await supabase.rpc('inspect_table_constraints', { table_name: 'parcels' });
  if (error) {
     // RPC might not exist, but let's try a direct query if possible
     // Since I can't run the RPC creation, I'll try to find any existing test file that does this.
     console.error('RPC inspect_table_constraints failed:', error);
  } else {
    console.log('Constraints:', data);
  }
}

test();
