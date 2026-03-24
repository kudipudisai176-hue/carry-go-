const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

// Create local schemas to avoid module loading issues in standalone script
const parcelSchema = new mongoose.Schema({
  sender: mongoose.Schema.Types.ObjectId,
  senderName: String,
  senderPhone: String,
  receiverName: String,
  receiverPhone: String,
  fromLocation: String,
  toLocation: String,
  city: String,
  village: String,
  weight: Number,
  size: String,
  itemCount: Number,
  vehicleType: String,
  distance: Number,
  price: Number,
  paymentMethod: String,
  paymentStatus: String,
  description: String,
  status: { type: String, default: 'pending' }
}, { timestamps: true });

const Parcel = mongoose.model('Parcel', parcelSchema);

const userSchema = new mongoose.Schema({
  name: String,
  phone: String,
  role: String
});
const User = mongoose.model('User', userSchema);

const seedParcels = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/carrygo';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for seeding...');

    // Find a sample sender user
    let sender = await User.findOne({ role: 'sender' });
    if (!sender) {
      console.log('No sender found, creating a dummy sender...');
      sender = await User.create({ name: "Demo Sender", phone: "+911234567890", role: "sender" });
    }

    const apCities = [
      { name: "Rajahmundry", village: "Danavaipeta" },
      { name: "Visakhapatnam", village: "Gajuwaka" },
      { name: "Vijayawada", village: "Patamata" },
      { name: "Guntur", village: "Tenali" },
      { name: "Nellore", village: "Kavali" },
      { name: "Kurnool", village: "Nandyal" },
      { name: "Tirupati", village: "Chandragiri" }
    ];

    const parcels = apCities.map(city => ({
      sender: sender._id,
      senderName: sender.name,
      senderPhone: sender.phone,
      receiverName: "Sample Receiver",
      receiverPhone: "+919876543210",
      fromLocation: city.name,
      toLocation: "Hyderabad, TS",
      city: city.name,
      village: city.village,
      weight: 2.5,
      size: "medium",
      itemCount: 1,
      vehicleType: "bike",
      distance: 450,
      price: 1350,
      paymentMethod: "pay-now",
      paymentStatus: "paid",
      description: `Urgent delivery from ${city.village}, ${city.name}`,
      status: "pending"
    }));

    // Clear existing pending parcels to avoid clutter
    await Parcel.deleteMany({ status: 'pending' });
    
    await Parcel.insertMany(parcels);
    console.log('Sample parcels seeded successfully for AP cities!');
    process.exit();
  } catch (error) {
    console.error('Error seeding parcels:', error);
    process.exit(1);
  }
};

seedParcels();
