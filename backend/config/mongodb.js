const mongoose = require('mongoose');

const connectMongoDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            console.error("❌ MONGO_URI is missing in .env");
            return;
        }

        const conn = await mongoose.connect(mongoURI);

        console.log(`✅ MongoDB Connected to: ${conn.connection.host}`);
    } catch (err) {
        console.error(`❌ MongoDB Connection Failed: ${err.message}`);
        // We don't crash the server because Supabase is the primary DB for now
    }
};

module.exports = { connectMongoDB };
