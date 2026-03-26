const dotenv = require('dotenv');
dotenv.config(); // ✅ MUST be first before any other imports that read process.env

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

connectDB();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('CarryGo API is running...');
});

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/parcels', require('./routes/parcelRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Server started
