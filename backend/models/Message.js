const { supabase } = require('../config/db');

const Message = {
  create: async (msgData) => {
    const normalized = {
      delivery_id: msgData.delivery,
      sender_id: msgData.sender,
      message: msgData.message
    };
    const { data, error } = await supabase
      .from('messages')
      .insert(normalized)
      .select()
      .single();
    if (error) throw error;
    return { ...data, _id: data.id };
  },

  find: (query = {}) => {
    let q = supabase.from('messages').select('*, sender:users!messages_sender_id_fkey(name, profile_photo)');
    for (const key in query) {
      const col = key === 'delivery' ? 'delivery_id' : key;
      q = q.eq(col, query[key]);
    }
    return {
      populate: function() { return this; },
      sort: function(sd) {
        if (!sd) return this;
        const field = Object.keys(sd)[0];
        // Map common field names
        const mappedField = field === 'createdAt' ? 'created_at' : field;
        q = q.order(mappedField, { ascending: sd[field] === 1 });
        return this;
      },
      then: async function(resolve, reject) {
        const { data, error } = await q;
        if (error) return reject(error);
        resolve(data.map(d => ({ ...d, _id: d.id, sender: d.sender ? d.sender : null })));
      }
    };
  },

  findById: (id) => {
    return {
      populate: function() {
        return this;
      },
      then: async function(resolve, reject) {
        const { data, error } = await supabase
          .from('messages')
          .select('*, sender:users!messages_sender_id_fkey(name, profile_photo)')
          .eq('id', id)
          .single();
        if (error) return reject(error);
        if (data) data._id = data.id;
        resolve(data);
      }
    };
  }
};

module.exports = Message;
