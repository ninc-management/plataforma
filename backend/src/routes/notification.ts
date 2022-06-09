import * as express from 'express';
import UserModel from '../models/user';
import { UserNotification } from '../models/user';
import { Mutex } from 'async-mutex';
import { notification$, usersMap } from '../shared/global';
import { cloneDeep, isEqual } from 'lodash';

const router = express.Router();
const mutex = new Mutex();
let lastNotification: UserNotification;

export function updateNotification(notification: UserNotification, res: any) {
  UserModel.findByIdAndUpdate(
    notification.to,
    { $push: { notifications: notification } },
    { upsert: false },
    (err, savedUser) => {
      if (err && res) {
        return res.status(500).json({
          message: res.req.url === '/' ? 'Erro ao enviar notificação!' : 'Erro ao enviar notificações!',
          error: err,
        });
      }
      if (Object.keys(usersMap).length > 0) usersMap[notification.to as any] = cloneDeep(savedUser.toJSON());
      notification$.next(notification);
      if (isEqual(notification, lastNotification) && res) {
        return res
          .status(200)
          .json({ message: res.req.url === '/' ? 'Notificação enviada!' : 'Notificações enviadas!' });
      }
    }
  );
}

/**
 * Make a request to send a notification
 * UserNotification:
 * @param {string} to
 * @param {string} from
 * @param {string} title
 * @param {string} message
 * @param {string} tag
 * @return {void}
 */
router.post('/', (req, res, next) => {
  mutex.acquire().then((release) => {
    lastNotification = req.body.notification;
    updateNotification(req.body.notification, res);
    release();
  });
});

/**
 * Make a request to send many notifications
 * UserNotification[]:
 * @param {string} to
 * @param {string} from
 * @param {string} title
 * @param {string} message
 * @param {string} tag
 * @return {void}
 */
router.post('/many', (req, res, next) => {
  mutex.acquire().then((release) => {
    lastNotification = req.body.notifications[req.body.notifications.length - 1];
    req.body.notifications.forEach((notification) => {
      updateNotification(notification, res);
    });
    release();
  });
});

/**
 * Make a request to delete a notification
 * UserNotification:
 * @param {string} to
 * @param {string} from
 * @param {string} title
 * @param {string} message
 * @param {string} tag
 * @return {void}
 */
router.post('/read', (req, res, next) => {
  mutex.acquire().then((release) => {
    UserModel.findByIdAndUpdate(
      { _id: req.body.notification.to },
      { $pull: { notifications: { _id: req.body.notification._id } } },
      { safe: true, multi: false, upsert: false },
      (err, savedUser) => {
        if (err) {
          return res.status(500).json({
            message: 'Falha ao ler notificação!',
            error: err,
          });
        }
        if (Object.keys(usersMap).length > 0) usersMap[req.body.notification.to] = cloneDeep(savedUser.toJSON());
        return res.status(200).json({ message: 'Notificação marcada como lida!' });
      }
    );
    release();
  });
});

export default router;
