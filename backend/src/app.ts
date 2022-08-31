import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import cron from 'node-cron';
import path from 'path';

import { NotificationApps } from './models/notification';
// import logger from 'morgan';
// Import API endpoint routes
import authRoutes from './routes/auth';
import contractRoutes from './routes/contract';
import contractorRoutes from './routes/contractor';
import courseRoutes from './routes/course';
import emailRoutes from './routes/email';
import internalTransactionRoutes from './routes/internalTransaction';
import invoiceRoutes from './routes/invoice';
import notificationRoutes from './routes/notification';
import configRoutes from './routes/platformConfig';
import promotionRoutes from './routes/promotion';
import publicRoutes from './routes/public';
import teamRoutes from './routes/team';
import transactionRoutes from './routes/transaction';
import userRoutes from './routes/user';
import { notification$ } from './shared/global';
import { isNotificationEnabled, isUserAuthenticated, notifyByEmail, overdueReceiptNotification } from './shared/util';

class NortanAPI {
  public app;

  constructor() {
    this.app = express();

    // Connect to the database before starting the application server.
    const options = {
      autoIndex: false,
      maxPoolSize: 250,
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
    };

    const connectWithRetry = () => {
      console.log('Trying to connect with database');
      return mongoose
        .connect(process.env.MONGODB_URI, options)
        .then(() => {
          console.log('Database connection ready!');
        })
        .catch((error) => {
          console.error('Database connection failed! ', error);
          console.log('Retrying in 2 seconds...');
          setTimeout(connectWithRetry, 2000);
        });
    };

    connectWithRetry();

    mongoose.connection.once('disconnected', () => {
      console.warn('Mongoose has been disconnected');
      connectWithRetry();
    });

    mongoose.set('returnOriginal', false);

    // app.use(logger('dev'));
    this.app.use(compression());
    this.app.use(
      helmet({
        contentSecurityPolicy: false,
      })
    );
    this.app.use(cors());
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: false, limit: '50mb' }));
    this.app.use('/', express.static(path.join(__dirname, 'angular')));

    // API Public Routes
    this.app.use('/api/public', publicRoutes);
    // API tooken validation
    this.app.use(isUserAuthenticated);
    // API endpoint routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/sendmail', emailRoutes);
    this.app.use('/api/user', userRoutes);
    this.app.use('/api/contractor', contractorRoutes);
    this.app.use('/api/contract', contractRoutes);
    this.app.use('/api/invoice', invoiceRoutes);
    this.app.use('/api/promotion', promotionRoutes);
    this.app.use('/api/team', teamRoutes);
    this.app.use('/api/course', courseRoutes);
    this.app.use('/api/config', configRoutes);
    this.app.use('/api/notify', notificationRoutes);
    this.app.use('/api/transaction/internal', internalTransactionRoutes);
    this.app.use('/api/transaction', transactionRoutes);

    // For all GET requests, send back index.html
    // so that PathLocationStrategy can be used
    this.app.get('/*', function (req, res) {
      res.sendFile(path.join(__dirname, '/angular/index.html'));
    });

    notification$.subscribe(async (notification) => {
      if (await isNotificationEnabled(notification.tag, NotificationApps.EMAIL)) notifyByEmail(notification);
    });

    cron.schedule(
      '0 00 07 * * *',
      () => {
        overdueReceiptNotification();
      },
      {
        scheduled: true,
        timezone: 'America/Sao_Paulo',
      }
    );
  }
}

export default { express: new NortanAPI().app, db: mongoose.connection };
