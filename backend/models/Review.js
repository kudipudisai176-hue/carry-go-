const { supabase } = require('../config/db');

const Review = {
  create: async (reviewData) => {
    const normalized = {
      reviewer_id: reviewData.reviewer,
      recipient_id: reviewData.reviewee,
      parcel_id: reviewData.parcel,
      rating: reviewData.rating,
      comment: reviewData.comment
    };
    const { data, error } = await supabase
      .from('reviews')
      .insert(normalized)
      .select()
      .single();
    if (error) throw error;
    return { ...data, _id: data.id };
  },

  find: (query = {}) => {
    let q = supabase.from('reviews').select('*, reviewer:users!reviews_reviewer_id_fkey(name, profile_photo)');
    for (const key in query) {
      const col = key === 'reviewee' ? 'recipient_id' : key;
      q = q.eq(col, query[key]);
    }
    return {
      populate: function() { return this; },
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

module.exports = Review;
