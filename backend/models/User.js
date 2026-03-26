const { supabase } = require('../config/db');
const bcrypt = require('bcryptjs');

// Helper: maps Supabase snake_case row → camelCase-compatible object
const mapUser = (data) => {
  if (!data) return null;
  return {
    ...data,
    _id: data.id,
    profilePhoto: data.profile_photo,
    walletBalance: data.wallet_balance,
    totalTrips: data.total_trips,
    personalOtp: data.personal_otp,
    personalOtpExpiresAt: data.personal_otp_expires_at,
    vehicleType: data.vehicle_type,
    sub_role: data.sub_role,
    adharNumber: data.adhar_number,
    adharPhoto: data.adhar_photo,
    idPhoto: data.id_photo,
    livePhoto: data.live_photo,
    save: async function () {
      const updateData = {
        name: this.name, email: this.email, phone: this.phone,
        role: this.role, sub_role: this.sub_role, bio: this.bio,
        profile_photo: this.profilePhoto || this.profile_photo,
        wallet_balance: this.walletBalance ?? this.wallet_balance ?? 0,
        total_trips: this.totalTrips ?? this.total_trips ?? 0,
        rating: this.rating,
        personal_otp: this.personalOtp || this.personal_otp,
        personal_otp_expires_at: this.personalOtpExpiresAt || this.personal_otp_expires_at,
        vehicle_type: this.vehicleType || this.vehicle_type,
        updated_at: new Date(),
      };
      Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);

      const { data: updated, error } = await supabase
        .from('users').update(updateData).eq('id', this.id).select().single();
      if (error) throw error;
      Object.assign(this, mapUser(updated));
      return this;
    },
    matchPassword: async function (enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
    }
  };
};

const User = {
  findById: (id) => {
    const q = supabase.from('users').select('*').eq('id', id).single();
    return {
      select: function () { return this; },
      then: async function (resolve) {
        const { data, error } = await q;
        resolve(error ? null : mapUser(data));
      }
    };
  },

  findOne: (query) => {
    let q = supabase.from('users').select('*');
    for (const key in query) {
      const val = query[key];
      if (typeof val === 'object' && val.$in) {
        q = q.in(key, val.$in);
      } else {
        q = q.eq(key, val);
      }
    }
    return {
      select: function () { return this; },
      then: async function (resolve) {
        const { data } = await q.maybeSingle();
        resolve(data ? mapUser(data) : null);
      }
    };
  },

  create: async (userData) => {
    const hashedPassword = await bcrypt.hash(userData.password, await bcrypt.genSalt(10));
    const normalized = {
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      phone: userData.phone,
      role: userData.role,
      sub_role: userData.sub_role,
      bio: userData.bio,
      profile_photo: userData.profilePhoto,
      wallet_balance: userData.walletBalance || 0,
      rating: userData.rating || 5.0,
      total_trips: userData.totalTrips || 0,
      personal_otp: userData.personalOtp,
      personal_otp_expires_at: userData.personalOtpExpiresAt,
      vehicle_type: userData.vehicleType,
    };
    Object.keys(normalized).forEach(k => normalized[k] === undefined && delete normalized[k]);

    const { data, error } = await supabase.from('users').insert(normalized).select().single();
    if (error) throw error;
    return mapUser(data);
  }
};

module.exports = User;
