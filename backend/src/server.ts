import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import restaurantRoutes from './routes/restaurantRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// REGISTER ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'API is running' });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);

    res.status(500).json({
      success: false,
      error: 'Something went wrong!',
    });
  }
);

// CREATE HTTP SERVER & SOCKET.IO SERVER
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-order', (orderId: string) => {
    socket.join(`order:${orderId}`);
    console.log(`${socket.id} joined order:${orderId}`);
  });

  socket.on('driver-location', (data: { orderId: string; latitude: number; longitude: number }) => {
    const { orderId, latitude, longitude } = data;
    console.log(`Driver location update for order:${orderId}`, { latitude, longitude });
    io.to(`order:${orderId}`).emit('location-updated', {
      latitude,
      longitude,
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`GoFood API & Socket server running on http://0.0.0.0:${PORT}`);
});
