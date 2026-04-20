const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { connectDB } = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Attach Socket.io to request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_chat', (deliveryId) => {
    socket.join(deliveryId);
    console.log(`Socket ${socket.id} joined delivery chat: ${deliveryId}`);
  });

  socket.on('join_user_notifications', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Socket ${socket.id} joined notification room: user_${userId}`);
  });

  // Signaling for Voice Calls
  socket.on('call_user', ({ userToCall, signalData, from, name, deliveryId }) => {
    io.to(`user_${userToCall}`).emit('incoming_call', { signal: signalData, from, name, deliveryId });
  });

  socket.on('answer_call', (data) => {
    io.to(`user_${data.to}`).emit('call_accepted', data.signal);
  });

  socket.on('end_call', ({ to }) => {
    io.to(`user_${to}`).emit('call_ended');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('CarryGo API (MongoDB) is running with WebSockets...');
});

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/parcels', require('./routes/parcelRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/payment', require('./routes/payment'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



// Trigger redeploy to apply new environment variables
