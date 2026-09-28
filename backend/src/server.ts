import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import restaurantRoutes from './routes/restaurantRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/restaurants', restaurantRoutes);

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

app.listen(PORT, () => {
  console.log(
    `GoFood API running on http://localhost:${PORT}`
  );
});
