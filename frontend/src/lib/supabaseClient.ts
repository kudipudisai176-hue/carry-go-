// Supabase has been removed in favour of the MongoDB backend.
// This stub exists to prevent import errors in any files that still reference it.
export const supabase = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signIn: async () => ({ data: null, error: new Error('Supabase removed') }),
    signOut: async () => ({ error: null }),
  },
  from: () => ({
    select: () => ({ data: null, error: new Error('Supabase removed') }),
    insert: () => ({ data: null, error: new Error('Supabase removed') }),
    update: () => ({ data: null, error: new Error('Supabase removed') }),
    delete: () => ({ data: null, error: new Error('Supabase removed') }),
    eq: function() { return this; },
    order: function() { return this; },
    limit: function() { return this; },
  }),
  channel: () => ({
    on: function() { return this; },
    subscribe: () => {},
  }),
  removeChannel: () => {},
};
