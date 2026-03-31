const { supabase } = require('../config/db');

const Notification = {
  // Simple creation for now
  create: async (notifData) => {
    const normalized = {
      ...notifData,
      recipient_id: notifData.recipient
    };
    delete normalized.recipient;
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(normalized)
      .select()
      .single();
    if (error) console.error("Notification create error:", error.message);
    return { ...data, _id: data?.id };
  },

  find: (query) => {
    let q = supabase.from('notifications').select('*');
    for (const key in query) {
      q = q.eq(key === 'recipient' ? 'recipient_id' : key, query[key]);
    }
    
    return {
      sort: function(sd) {
        const field = Object.keys(sd)[0];
        q = q.order(field, { ascending: sd[field] === 1 });
        return this;
      },
      then: async function(resolve, reject) {
        const { data, error } = await q;
        if (error) return reject(error);
        resolve(data.map(d => ({ ...d, _id: d.id })));
      }
    };
  }
};

module.exports = Notification;
