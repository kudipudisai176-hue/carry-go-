const { supabase } = require('../config/db');

const Payment = {
  create: async (paymentData) => {
    const normalized = {
      ...paymentData,
      parcel_id: paymentData.parcel_id || paymentData.parcel,
      sender_id: paymentData.sender_id || paymentData.sender
    };
    if (normalized.parcel) delete normalized.parcel;
    if (normalized.sender) delete normalized.sender;
    
    const { data, error } = await supabase
      .from('payments')
      .insert(normalized)
      .select()
      .single();
    if (error) throw error;
    return { ...data, _id: data.id };
  },

  updateMany: async (filter, updateObj) => {
    let q = supabase.from('payments').update(updateObj.$set || updateObj);
    for (const key in filter) {
       const k = key === 'parcel' ? 'parcel_id' : key;
       q = q.eq(k, filter[key]);
    }
    return await q;
  }
};

module.exports = Payment;
