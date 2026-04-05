const { supabase } = require('../config/db');

const Parcel = {
  // Find parcels by custom query
  find: async (query = {}) => {
    // 🔍 IMPORTANT: Use explicit LEFT JOINs to avoid filtering out parcels with no traveller assigned
    const userFields = 'id, name, profilePhoto:profile_photo, phone, email, bio, rating, totalTrips:total_trips, vehicleType:vehicle_type, aadharNumber:aadhar_number, idPhoto:id_photo';
    
    let q = supabase.from('parcels').select(`
      *,
      sender:users!fk_parcel_sender(${userFields}),
      traveller:users!fk_parcel_traveller(${userFields})
    `);

    // Handle queries
    for (const key in query) {
      const val = query[key];
      const dbKey = key === '_id' ? 'id' : key;

      if (key === '$or' && Array.isArray(val)) {
        const orQuery = val.map(condition => {
          const k = Object.keys(condition)[0];
          const v = condition[k];
          const realK = k === '_id' ? 'id' : k;
          if (v?.$regex) return `${realK}.ilike.*${v.$regex}*`;
          return `${realK}.eq.${v}`;
        }).join(',');
        q = q.or(orQuery);

      } else if (val?.$regex) {
        q = q.ilike(dbKey, `*${val.$regex}*`);

      } else if (val?.$ne !== undefined) {
        q = q.neq(dbKey, val.$ne);

      } else if (val?.$in !== undefined && Array.isArray(val.$in)) {
        q = q.in(dbKey, val.$in);

      } else if (val === null) {
        q = q.is(dbKey, null);

      } else {
        q = q.eq(dbKey, val);
      }
    }

    // Default sorting if not specified elsewhere (can be overwritten by calling code if we return q)
    // But since the user wants a clean async find, we'll execute it here or return the query.
    // To support .sort() in routes, we'll return a "thenable" that still allows .order()
    
    // Actually, for "CLEAN WAY", we'll implement sort as a separate method if needed, 
    // or just pass it in find(query, options).
    // Let's stick to the user's provided "FINAL" function structure as it's what they asked for.
    
    const { data, error } = await q.order('created_at', { ascending: false });
    
    if (error) {
       console.error("[Parcel Model] Search Error:", error);
       throw error;
    }

    return (data || []).map(d => ({ ...d, _id: d.id }));
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
        .single(); // Using single as requested

      if (error) {
        console.error(`[Parcel Model] Supabase error in findById:`, error.message);
        return null;
      }

      return {
        ...data,
        _id: data.id,
        save: async function() {
          const { id, _id, created_at, updated_at, sender, traveller, ...updateData } = this;
          
          // Field cleanup to ensure ONLY snake_case goes to DB
          const cleanUpdate = {};
          for (const key in updateData) {
            // Keep only snake_case or standard fields
            if (key.includes('_') || ['title', 'description', 'id', 'weight', 'size', 'price', 'status', 'city', 'village'].includes(key)) {
              cleanUpdate[key] = updateData[key];
            }
          }

          const { data: updated, error: uError } = await supabase
            .from('parcels')
            .update({ ...cleanUpdate, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

          if (uError) throw uError;
          Object.assign(this, updated);
          return this;
        }
      };
    } catch (err) {
      console.error(`[Parcel Model] Error in findById:`, err.message);
      return null;
    }
  },

  create: async (parcelData) => {
    // 🧊 Data Normalization: Keep only snake_case for DB columns
    const normalized = {
      from_location: parcelData.from_location || parcelData.fromLocation,
      to_location: parcelData.to_location || parcelData.toLocation,
      village: parcelData.village,
      city: parcelData.city,
      description: parcelData.description,
      weight: parcelData.weight,
      size: parcelData.size,
      item_count: parcelData.item_count || parcelData.itemCount || 1,
      vehicle_type: parcelData.vehicle_type || parcelData.vehicleType,
      parcel_photo: parcelData.parcel_photo || parcelData.parcelPhoto,
      receiver_name: parcelData.receiver_name || parcelData.receiverName,
      receiver_phone: parcelData.receiver_phone || parcelData.receiverPhone,
      sender_id: parcelData.sender_id || parcelData.senderId,
      sender_name: parcelData.sender_name || parcelData.senderName,
      sender_phone: parcelData.sender_phone || parcelData.senderPhone,
      receiver_id: parcelData.receiver_id || parcelData.receiverId,
      parcel_charge: parcelData.parcel_charge,
      platform_fee: parcelData.platform_fee,
      price: parcelData.price,
      status: parcelData.status || 'open_for_travellers',
      payment_method: parcelData.payment_method || parcelData.paymentMethod,
      payment_status: parcelData.payment_status || parcelData.paymentStatus,
      escrow_status: parcelData.escrow_status,
      pickup_otp: parcelData.pickup_otp,
      delivery_otp: parcelData.delivery_otp,
    };
    
    // Remove undefined values to avoid DB issues
    Object.keys(normalized).forEach(key => normalized[key] === undefined && delete normalized[key]);

    const { data, error } = await supabase
      .from('parcels')
      .insert(normalized)
      .select()
      .single();
      
    if (error) {
      console.error("[Parcel Model] Supabase Insert Error:", error);
      throw error;
    }
    return { ...data, _id: data.id };
  },

  updateMany: async (filter, update) => {
    const updateData = update.$set || update;
    let q = supabase.from('parcels').update(updateData);
    
    for (const key in filter) {
      const dbKey = key === '_id' ? 'id' : key;
      const val = filter[key];
      if (val === null) q = q.is(dbKey, null);
      else q = q.eq(dbKey, val);
    }
    return await q;
  },

  deleteOne: async (filter) => {
     let q = supabase.from('parcels').delete();
     for (const key in filter) {
       const dbKey = key === '_id' ? 'id' : key;
       const val = filter[key];
       if (val === null) q = q.is(dbKey, null);
       else q = q.eq(dbKey, val);
     }
     return await q;
  }
};

module.exports = Parcel;
