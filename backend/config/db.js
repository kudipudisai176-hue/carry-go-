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

const connectDB = async () => {
  try {
    // Light check - just verify the Supabase client can communicate
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = empty result, which is fine
      console.warn(`⚠️  Supabase ping warning: ${error.message}`);
      console.warn("   Make sure you have run the SQL schema in your Supabase dashboard.");
    } else {
      console.log(`✅ Supabase Connected to: ${supabaseUrl}`);
    }
  } catch (error) {
    console.warn(`⚠️  Supabase setup issue: ${error.message}`);
    console.warn("   Server will continue but DB calls may fail until tables are created.");
  }
};

module.exports = { supabase, connectDB };
