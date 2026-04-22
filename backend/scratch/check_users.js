const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = require('../config/supabase');

async function checkUsers() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('email, id, password');
    
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      console.log('Current users in Supabase:');
      if (data && data.length > 0) {
        // Only show first few chars of password hash for privacy
        const masked = data.map(u => ({ 
          ...u, 
          password: u.password ? u.password.substring(0, 10) + '...' : 'MISSING' 
        }));
        console.table(masked);
      } else {
        console.log('No users found in database.');
      }
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
}

checkUsers();
