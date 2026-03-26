const { supabase } = require('../config/db');

const Parcel = {
  // Find parcels by custom query
  find: (query = {}) => {
    let q = supabase.from('parcels').select('*, sender:users!parcels_sender_id_fkey(*), traveller:users!parcels_traveller_id_fkey(*)');
    
    // Convert Mongoose queries to Supabase
    for (const key in query) {
      const val = query[key];
      if (key === '$or') {
        const orQuery = val.map(condition => {
          const k = Object.keys(condition)[0];
          const v = condition[k];
          if (v && v.$regex) return `${k}.ilike.%${v.$regex}%`;
          return `${k}.eq.${v}`;
        }).join(',');
        q = q.or(orQuery);
      } else if (val && val.$regex) {
        q = q.ilike(key, `%${val.$regex}%`);
      } else if (val && val.$ne) {
        q = q.neq(key, val.$ne);
      } else if (val && val.$in) {
        q = q.in(key, val.$in);
      } else {
        q = q.eq(key, val);
      }
    }
    
    return {
      populate: function() { return this; }, // Mocking for now as we auto-populate
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
  },

  findById: async (id) => {
    const { data, error } = await supabase
      .from('parcels')
      .select('*, sender:users!parcels_sender_id_fkey(*), traveller:users!parcels_traveller_id_fkey(*)')
      .eq('id', id)
      .single();
    if (error) return null;
    
    return { 
      ...data, 
      _id: data.id,
      save: async function() {
        const { id, _id, created_at, updated_at, sender, traveller, ...updateData } = this;
        const { data: updated, error: uError } = await supabase
          .from('parcels')
          .update({ ...updateData, updated_at: new Date() })
          .eq('id', id)
          .select()
          .single();
        if (uError) throw uError;
        Object.assign(this, updated);
        return this;
      }
    };
  },

  create: async (parcelData) => {
    // Standardize sender/traveller id naming (supabase uses sender_id, mongoose used sender)
    const normalized = {
      ...parcelData,
      sender_id: parcelData.sender,
      traveller_id: parcelData.traveller,
      receiver_id: parcelData.receiver,
    };
    delete normalized.sender;
    delete normalized.traveller;
    delete normalized.receiver;

    const { data, error } = await supabase
      .from('parcels')
      .insert(normalized)
      .select()
      .single();
    if (error) throw error;
    return { ...data, _id: data.id };
  },

  updateMany: async (filter, update) => {
    let q = supabase.from('parcels').update(update.$set || update);
    for (const key in filter) {
      q = q.eq(key, filter[key]);
    }
    return await q;
  },

  deleteOne: async (filter) => {
     let q = supabase.from('parcels').delete();
     for (const key in filter) {
       q = q.eq(key, filter[key] === '_id' ? 'id' : filter[key]);
     }
     return await q;
  }
};

module.exports = Parcel;
