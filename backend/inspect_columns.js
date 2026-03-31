require('dotenv').config({ path: __dirname + '/.env' });
const { supabase } = require('./config/db');

async function test() {
  const { data, error } = await supabase.from('parcels').select('*').limit(1);
  if (error) {
    console.error('Error fetching parcels:', error);
    return;
  }
  if (data && data.length > 0) {
    const fs = require('fs');
    fs.writeFileSync('parcel_columns.json', JSON.stringify(Object.keys(data[0]), null, 2));
    console.log('Columns written to parcel_columns.json');
  } else {
    console.log('No parcels found to inspect columns.');
  }
}

test();
