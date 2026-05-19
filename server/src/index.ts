import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { connectDB } from './config/db';
import { initSocket } from './socket';

import authRoutes from './routes/auth.routes';
import lotRoutes from './routes/lot.routes';
import slotRoutes from './routes/slot.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import ownerRoutes from './routes/owner.routes';
import adminRoutes from './routes/admin.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Init Socket.io
initSocket(server);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/lots', lotRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);

// Database connection
connectDB();

app.get('/', (req, res) => {
  res.send('ParkIt API is running...');
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
