import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import { CATEGORIES, MAX_QTY_PER_ITEM, ORDER_STATUSES, PAYMENT_METHODS, SHIPPING, STATUS_FLOW } from './config/store.js';
import { fromCents } from './utils/money.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  const origins = (process.env.CLIENT_ORIGIN ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  app.use(helmet({ contentSecurityPolicy: { directives: { 'img-src': ["'self'", 'data:', 'https:'] } } }));
  app.use(cors({ origin: origins.length ? origins : false, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  });
  app.get('/api/meta', (req, res) =>
    res.json({
      categories: CATEGORIES,
      orderStatuses: ORDER_STATUSES,
      statusFlow: STATUS_FLOW,
      paymentMethods: PAYMENT_METHODS,
      maxQtyPerItem: MAX_QTY_PER_ITEM,
      shipping: { flat: fromCents(SHIPPING.flatCents), freeOver: fromCents(SHIPPING.freeOverCents) },
    })
  );
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/cart', cartRoutes);
  app.use('/api/orders', orderRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api', notFound);

  if (process.env.NODE_ENV === 'production' && fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('/{*splat}', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp();
