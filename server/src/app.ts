import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';
import { config } from './config/index.js';

export const app = express();

app.use(cors());
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Health & Brand Status Endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'GharSaathi Backend API',
    tagline: config.brandTagline,
    supportPhone: config.businessSupportPhone,
    timestamp: new Date().toISOString(),
  });
});

// Mount Main API Router
app.use('/api', apiRouter);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});
