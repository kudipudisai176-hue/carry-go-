const { supabase } = require('../config/db');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // 🛡️ Verify via Supabase Admin (Reliable)
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error("[Auth] Supabase token verification failed:", error?.message);
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }

      // 👤 Attach user profile to request (matching local DB or Supabase context)
      let dbUser = await User.findById(user.id);
      
      // 🚀 PERFORMANCE FIX: Only Sync if missing. 
      // Prevents 1000s of redundant writes from background polls.
      if (!dbUser) {
        console.log(`[Auth] User ${user.id} missing from public.users. Syncing...`);
        // Extract basic info from Supabase Auth
        const syncData = {
          id: user.id,
          email: user.email,
          phone: user.phone || user.user_metadata?.phone || "",
          name: user.user_metadata?.full_name || user.user_metadata?.name || "User",
          role: user.user_metadata?.role || 'sender',
          profile_photo: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
        };
        
        try {
          const { data, error: syncError } = await supabase
            .from('users')
            .upsert(syncData, { onConflict: 'id' })
            .select()
            .single();

          if (syncError) {
             console.error("[Auth] User sync failed:", syncError.message);
             // Last resort: inject a minimal mock so the request doesn't crash, 
             // but if DB rejects it (FK), the error is expected.
             req.user = { _id: user.id, id: user.id, ...syncData };
          } else {
             dbUser = data;
             req.user = { ...dbUser, _id: dbUser.id };
          }
        } catch (err) {
          console.error("[Auth] Unexpected sync error:", err.message);
          req.user = { _id: user.id, id: user.id, ...user.user_metadata };
        }
      } else {
        req.user = dbUser;
      }

      return next();
    } catch (error) {
      console.error("[Auth] Error in protect middleware:", error.message);
      return res.status(401).json({ message: 'Not authorized, unexpected error' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
