import * as express from 'express';
import UserModel from '../models/user';
import { UserNotification } from '../models/user';
import { Mutex } from 'async-mutex';
import { notification$, usersMap } from '../shared/global';
import { cloneDeep, isEqual } from 'lodash';

const router = express.Router();
const mutex = new Mutex();
let lastNotification: UserNotification;

function updateNotification(notification: UserNotification, res: any) {
  UserModel.findByIdAndUpdate(
    (notification.to as any)._id,
    { $push: { notifications: notification } },
    { upsert: false },
    (err, savedUser) => {
      if (err) {
        return res.status(500).json({
          message: res.req.url === '/' ? 'Erro ao enviar notificação!' : 'Erro ao enviar notificações!',
          error: err,
        });
      }
      if (Object.keys(usersMap).length > 0) usersMap[(notification.to as any)._id] = cloneDeep(savedUser.toJSON());
      if (isEqual(notification, lastNotification)) {
        notification$.next(notification);
        return res
          .status(200)
          .json({ message: res.req.url === '/' ? 'Notificação enviada!' : 'Notificações enviadas!' });
      }
    }
  );
}

router.post('/', (req, res, next) => {
  mutex.acquire().then((release) => {
    lastNotification = req.body.notification;
    updateNotification(req.body.notification, res);
    release();
  });
});

router.post('/many', (req, res, next) => {
  mutex.acquire().then((release) => {
    lastNotification = req.body.notifications[req.body.notifications.length - 1];
    req.body.notifications.forEach((notification) => {
      updateNotification(notification, res);
    });
    release();
  });
});

export default router;
