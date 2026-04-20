const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error("❌ MONGO_URI is missing in environment");
      return; // On serverless, we don't want to kill the process hard
    }

    console.log(`[Database] Attempting to connect to MongoDB...`);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,  // Wait 5s instead of 15s
      socketTimeoutMS: 30000,         // Close sockets after 30s
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Failed: ${err.message}`);
    // Don't exit process in serverless
  }
};

module.exports = { connectDB };
