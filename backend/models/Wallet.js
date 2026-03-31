const { supabase } = require('../config/db');

const Wallet = {
  findOne: (query) => {
    let q = supabase.from('wallets').select('*');
    for (const key in query) {
      q = q.eq(key === 'user' ? 'user_id' : key, query[key]);
    }
    
    return {
      then: async function(resolve, reject) {
        const { data, error } = await q.maybeSingle();
        if (error) return resolve(null);
        if (!data) return resolve(null);
        
        return resolve({ 
          ...data, 
          _id: data.id, 
          save: async function() {
            const { id, _id, created_at, last_updated, ...updateData } = this;
            const { data: updated, error: uError } = await supabase
              .from('wallets')
              .update({ ...updateData, last_updated: new Date() })
              .eq('id', id)
              .select()
              .single();
            if (uError) throw uError;
            Object.assign(this, updated);
            return this;
          }
        });
      }
    };
  },

  create: async (walletData) => {
    const normalized = {
      ...walletData,
      user_id: walletData.user
    };
    delete normalized.user;
    
    const { data, error } = await supabase
      .from('wallets')
      .insert(normalized)
      .select()
      .single();
    if (error) throw error;
    return { ...data, _id: data.id };
  }
};

module.exports = Wallet;
