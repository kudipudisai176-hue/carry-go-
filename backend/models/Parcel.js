const { supabase } = require('../config/db');

const Parcel = {
  // Find parcels by custom query
  find: (query = {}) => {
    // 🔍 IMPORTANT: Use explicit LEFT JOINs to avoid filtering out parcels with no traveller assigned
    const userFields = 'id, name, profile_photo, phone, email, bio, rating, total_trips, vehicle_type, aadhar_number, id_photo';
    let q = supabase.from('parcels').select(`
      *,
      sender:users!fk_parcel_sender(${userFields}),
      traveller:users!fk_parcel_traveller(${userFields})
    `);
    
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
    try {
      console.log(`[Parcel Model] Attempting to find parcel: ${id}`);
      const { data, error } = await supabase
        .from('parcels')
        .select(`
          *,
          sender:users!fk_parcel_sender(*),
          traveller:users!fk_parcel_traveller(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error(`[Parcel Model] Supabase error in findById:`, error.message);
        return null;
      }

      if (!data) {
        console.warn(`[Parcel Model] Parcel not found (ID: ${id})`);
        return null;
      }

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
    } catch (err) {
      console.error(`[Parcel Model] Generic error in findById:`, err.message);
      return null;
    }
  },

  create: async (parcelData) => {
    // Standardize: Ensure all ID fields use _id suffix for Supabase
    const normalized = {
      ...parcelData,
      sender_id: parcelData.sender_id || parcelData.sender,
      traveller_id: parcelData.traveller_id || parcelData.traveller,
      receiver_id: parcelData.receiver_id || parcelData.receiver,
    };
    // Remove Mongoose-style keys if they exist
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
    // Support both $set and direct update object
    const updateData = update.$set || update;
    let q = supabase.from('parcels').update(updateData);
    
    for (const key in filter) {
      const dbKey = key === '_id' ? 'id' : key;
      q = q.eq(dbKey, filter[key]);
    }
    return await q;
  },

  deleteOne: async (filter) => {
     let q = supabase.from('parcels').delete();
     for (const key in filter) {
       const dbKey = key === '_id' ? 'id' : key;
       q = q.eq(dbKey, filter[key]);
     }
     return await q;
  }
};

module.exports = Parcel;
