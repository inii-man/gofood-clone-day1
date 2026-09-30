import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import restaurantRoutes from './routes/restaurantRoutes';
import authRoutes from './routes/authRoutes';
import orderRoutes from './routes/orderRoutes';
import deviceRoutes from './routes/deviceRoutes';
import paymentRoutes from './routes/paymentRoutes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// REQUEST LOGGER WITH AUTH PREVIEW & DURATION
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  const authHeader = req.headers.authorization;
  const tokenPreview = authHeader
    ? `Bearer ${authHeader.replace('Bearer ', '').slice(0, 10)}...`
    : '❌ NO_TOKEN';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusIcon = status >= 500 ? '💥' : status >= 400 ? '⚠️' : '✅';

    console.log(
      `${statusIcon} [HTTP] ${method.padEnd(6)} ${originalUrl.padEnd(20)} -> ${status} (${duration}ms) | Auth: ${tokenPreview}`
    );
  });

  next();
});

// REGISTER ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/payments', paymentRoutes);


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
export const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
});


app.get('/api/socket-rooms', (_req, res) => {
  const roomsMap = io.sockets.adapter.rooms;
  const sidsMap = io.sockets.adapter.sids;

  // Filter room buatan (misal order:123), singkirkan default room bawaan socket.id
  const customRooms: Record<string, { memberCount: number; socketIds: string[] }> = {};
  roomsMap.forEach((membersSet, roomName) => {
    if (!sidsMap.has(roomName)) {
      customRooms[roomName] = {
        memberCount: membersSet.size,
        socketIds: Array.from(membersSet),
      };
    }
  });

  res.json({
    totalConnectedClients: sidsMap.size,
    totalActiveRooms: Object.keys(customRooms).length,
    rooms: customRooms,
  });
});

io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET] Client connected: ${socket.id}`);

  socket.on('join-order', (orderId: string) => {
    const roomName = `order:${orderId}`;
    socket.join(roomName);
    const memberCount = io.sockets.adapter.rooms.get(roomName)?.size || 1;
    console.log(`🏠 [SOCKET] ${socket.id} BERHASIL join "${roomName}" (Total client di room ini: ${memberCount})`);
  });

  socket.on('driver-location', (data: { orderId: string; latitude: number; longitude: number }) => {
    const { orderId, latitude, longitude } = data;
    const roomName = `order:${orderId}`;
    const memberCount = io.sockets.adapter.rooms.get(roomName)?.size || 0;
    console.log(`📍 [SOCKET] Driver emit lokasi ke "${roomName}" (${memberCount} penerima):`, { latitude, longitude });
    io.to(roomName).emit('location-updated', {
      latitude,
      longitude,
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 [SOCKET] Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`GoFood API & Socket server running on http://0.0.0.0:${PORT}`);
});
