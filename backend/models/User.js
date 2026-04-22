const createModel = require('../utils/modelFactory');
const bcrypt = require('bcryptjs');

const userModel = createModel('users');

const User = {
  ...userModel,
  
  async create(userData) {
    if (userData.email) userData.email = userData.email.toLowerCase().trim();
    
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    const user = await userModel.create(userData);
    return this._addUserMethods(user);
  },

  findOne(query) {
    if (query && query.email) query.email = query.email.toLowerCase().trim();
    
    const queryObj = userModel.findOne(query);
    const originalExec = queryObj.exec.bind(queryObj);
    
    queryObj.exec = async () => {
      const user = await originalExec();
      if (!user) {
        console.log(`[User Model] No user found for query: ${JSON.stringify(query)}`);
      } else {
        console.log(`[User Model] Found user: ${user.email}`);
      }
      return this._addUserMethods(user);
    };
    
    return queryObj;
  },

  findById(id) {
    const queryObj = userModel.findById(id);
    const originalExec = queryObj.exec.bind(queryObj);
    
    queryObj.exec = async () => {
      const user = await originalExec();
      return this._addUserMethods(user);
    };
    
    return queryObj;
  },

  _addUserMethods(user) {
    if (user) {
      if (Array.isArray(user)) {
        return user.map(u => this._addUserMethods(u));
      }
      
      user.matchPassword = async function(pass) {
        if (!this.password) {
          console.error(`[User Model] matchPassword failed: No password hash for user ${this.email}`);
          return false;
        }
        const isMatch = await bcrypt.compare(pass, this.password);
        console.log(`[User Model] Password match attempt for ${this.email}: ${isMatch ? 'SUCCESS' : 'FAILED'}`);
        return isMatch;
      };
    }
    return user;
  }
};

module.exports = User;
