const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class JsonModel {
  constructor(modelName) {
    this.modelName = modelName;
    this.filePath = path.join(DATA_DIR, `${modelName.toLowerCase()}s.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  async read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (err) {
      console.error(`Error reading ${this.modelName}:`, err);
      return [];
    }
  }

  async write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Error writing ${this.modelName}:`, err);
    }
  }

  async find(query = {}) {
    const data = await this.read();
    return data.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const data = await this.read();
    return data.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findById(id) {
    const data = await this.read();
    return data.find(item => item._id === id || item.id === id);
  }

  async create(doc) {
    const data = await this.read();
    const newDoc = { 
      _id: uuidv4(), 
      id: uuidv4(),
      createdAt: new Date(), 
      updatedAt: new Date(), 
      ...doc 
    };
    data.push(newDoc);
    await this.write(data);
    return newDoc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const data = await this.read();
    const index = data.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    
    const updatedDoc = { ...data[index], ...update, updatedAt: new Date() };
    data[index] = updatedDoc;
    await this.write(data);
    return updatedDoc;
  }

  async findOneAndDelete(query) {
    const data = await this.read();
    const index = data.findIndex(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    if (index === -1) return null;
    const deleted = data.splice(index, 1);
    await this.write(data);
    return deleted[0];
  }

  async deleteOne(query) {
    return this.findOneAndDelete(query);
  }
}

module.exports = JsonModel;
