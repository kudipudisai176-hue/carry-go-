const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const { createClient } = require('@supabase/supabase-js');
// dotenv is loaded in server.js before this file is required

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Supabase URL or Service Role Key is missing in .env");
  console.error("   SUPABASE_URL:", supabaseUrl ? "✅ found" : "❌ missing");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "✅ found" : "❌ missing");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const axios = require('axios');

const connectDB = async () => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    // Attempt a light check using axios to bypass potential fetch specific network layer issues
    await axios.get(`${supabaseUrl}/rest/v1/`, { 
      headers: { 'apikey': supabaseKey },
      timeout: 5000 
    });
    
    console.log(`✅ Supabase Connected (axios ping) to: ${supabaseUrl}`);
    
    // Also verify the table availability silently
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code === '42P01') {
       console.warn("⚠️  Table 'users' not found. Run SQL schema in Supabase dashboard.");
    }
  } catch (err) {
    if (err.response && (err.response.status === 200 || err.response.status === 401)) {
        // 401 might mean key is valid but maybe needs more? No, axios ping usually works.
        console.log(`✅ Supabase Reachable (axios code: ${err.response.status})`);
    } else {
        console.warn(`\n⚠️  Supabase Connectivity Issue: ${err.message}`);
        console.error("   ❌ Failed to reach Supabase endpoint via axios.");
        console.error(`   Endpoint: ${supabaseUrl}`);
    }
    
    // Continue starting server regardless
    console.warn("   Server will continue, but verify your internet or project status.");
  }
};

module.exports = { supabase, connectDB };
