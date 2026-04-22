const supabase = require('../config/supabase');

const createModel = (tableName) => {
  const table = tableName.toLowerCase().endsWith('s') ? tableName.toLowerCase() : `${tableName.toLowerCase()}s`;

  const wrapResult = (data) => {
    if (!data) return data;
    if (Array.isArray(data)) return data.map(item => wrapResult(item));
    
    return {
      ...data,
      _id: data.id,
      save: async function() {
        // 🧹 Clean the payload for Supabase
        const payload = {};
        for (const key in this) {
          // Only include lowercase/snake_case fields that are not methods
          // Also allow 'id' as it is the primary key
          if (
            typeof this[key] !== 'function' && 
            key !== '_id' && 
            (key === 'id' || /^[a-z0-9_]+$/.test(key))
          ) {
            payload[key] = this[key];
          }
        }
        
        const { data: updated, error } = await supabase
          .from(table)
          .update(payload)
          .eq('id', this.id)
          .select()
          .single();
          
        if (error) {
          console.error(`[DB Error] ${table}.save:`, error.message);
          throw error;
        }
        return wrapResult(updated);
      }
    };
  };

  const createQuery = (method, arg) => {
    return {
      _select: '*',
      _sort: null,
      _limit: null,

      select: function() { return this; },
      populate: function() { return this; },
      sort: function(s) { this._sort = s; return this; },
      limit: function(l) { this._limit = l; return this; },
      skip: function() { return this; },

      exec: async function() {
        let q = supabase.from(table).select(this._select, { count: 'exact' });

        const applyFilter = (query, filter) => {
          let currentQ = query;
          for (const key in filter) {
            const val = filter[key];
            if (key === '$or' && Array.isArray(val)) {
              const orConditions = val.map(cond => {
                const k = Object.keys(cond)[0];
                const v = cond[k];
                return `${k}.eq.${v}`;
              }).join(',');
              currentQ = currentQ.or(orConditions);
            } else if (typeof val === 'object' && val !== null) {
              if (val.$ne || val.$neq) currentQ = currentQ.neq(key, val.$ne || val.$neq);
              if (val.$in) currentQ = currentQ.in(key, val.$in);
              if (val.$regex) currentQ = currentQ.ilike(key, `%${val.$regex}%`);
            } else {
              currentQ = currentQ.eq(key, val);
            }
          }
          return currentQ;
        };

        if (method === 'findById') {
          q = q.eq('id', arg).maybeSingle();
        } else {
          q = applyFilter(q, arg || {});
          if (method === 'findOne') q = q.maybeSingle();
        }

        if (this._sort) {
          const sortKey = Object.keys(this._sort)[0];
          q = q.order(sortKey, { ascending: this._sort[sortKey] === 1 });
        }
        if (this._limit) q = q.limit(this._limit);

        const { data, error } = await q;
        if (error) {
          console.error(`[DB Error] ${table}.${method}:`, error.message);
          throw error;
        }
        return wrapResult(data);
      },

      then: function(resolve, reject) {
        return this.exec().then(resolve, reject);
      }
    };
  };

  return {
    find: (query) => createQuery('find', query),
    findOne: (query) => createQuery('findOne', query),
    findById: (id) => createQuery('findById', id),
    
    create: async (doc) => {
      // 🧹 Clean the doc for initial creation
      const cleanDoc = {};
      for (const key in doc) {
        if (key !== '_id' && (key === 'id' || /^[a-z0-9_]+$/.test(key))) {
          cleanDoc[key] = doc[key];
        }
      }
      
      const { data, error } = await supabase.from(table).insert(cleanDoc).select().single();
      if (error) {
        console.error(`[DB Error] ${table}.create:`, error.message);
        throw error;
      }
      return wrapResult(data);
    },

    updateMany: async (filter, update) => {
      const rawPayload = update.$set || update;
      const payload = {};
      for (const key in rawPayload) {
        if (key !== '_id' && (key === 'id' || /^[a-z0-9_]+$/.test(key))) {
          payload[key] = rawPayload[key];
        }
      }
      
      let q = supabase.from(table).update(payload);
      for (const key in filter) {
        q = q.eq(key, filter[key]);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },

    findByIdAndDelete: async (id) => {
      const { data, error } = await supabase.from(table).delete().eq('id', id).select().maybeSingle();
      if (error) throw error;
      return data;
    },

    countDocuments: async (query = {}) => {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true }).match(query);
      if (error) throw error;
      return count;
    }
  };
};

module.exports = createModel;
