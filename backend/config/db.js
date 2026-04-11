const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error("❌ MONGO_URI is missing in .env");
      process.exit(1);
    }

    console.log(`[Database] Attempting to connect to MongoDB...`);
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000, // Wait 15s instead of 30s
      socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB Connection Failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB };
