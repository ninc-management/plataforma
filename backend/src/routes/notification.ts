import * as express from 'express';
import { isEqual } from 'lodash';

import { Notification, NotificationApps } from '../models/notification';
import UserModel from '../models/user';
import { getModelForCompany, getPermissionsFromNotificationConfig, notifyByEmail } from '../shared/util';

const router = express.Router();
let lastNotification: Notification;

export async function updateNotification(notification: Notification, companyId: string, res: any) {
  const notificationConfig = await getPermissionsFromNotificationConfig(companyId, notification.tag);
  if (notificationConfig[NotificationApps.PLATFORM]) {
    try {
      const userCompanyModel = await getModelForCompany(companyId, UserModel);
      await userCompanyModel.findByIdAndUpdate(
        notification.to,
        { $push: { notifications: notification } },
        { upsert: false }
      );
      if (notificationConfig[NotificationApps.EMAIL]) notifyByEmail(notification);
      if (isEqual(notification, lastNotification) && res) {
        return res
          .status(200)
          .json({ message: res.req.url === '/' ? 'Notificação enviada!' : 'Notificações enviadas!' });
      }
    } catch (err) {
      return res.status(500).json({
        message: res.req.url === '/' ? 'Erro ao enviar notificação!' : 'Erro ao enviar notificações!',
        error: err,
      });
    }
  } else {
    if (notificationConfig[NotificationApps.EMAIL]) notifyByEmail(notification);
  }
}

/**
 * Make a request to send a notification
 * Notification:
 * @param {string} to
 * @param {string} from
 * @param {string} title
 * @param {string} message
 * @param {string} tag
 * @return {void}
 */
router.post('/', (req, res, next) => {
  lastNotification = req.body.notification;
  updateNotification(req.body.notification, req.headers.companyid as string, res);
});

/**
 * Make a request to send many notifications
 * Notification[]:
 * @param {string} to
 * @param {string} from
 * @param {string} title
 * @param {string} message
 * @param {string} tag
 * @return {void}
 */
router.post('/many', (req, res, next) => {
  lastNotification = req.body.notifications[req.body.notifications.length - 1];
  req.body.notifications.forEach((notification) => {
    updateNotification(notification, req.headers.companyid as string, res);
  });
});

/**
 * Make a request to delete a notification
 * Notification:
 * @param {string} to
 * @param {string} from
 * @param {string} title
 * @param {string} message
 * @param {string} tag
 * @return {void}
 */
router.post('/read', async (req, res, next) => {
  try {
    const companyId = req.headers.companyid as string;
    const userCompanyModel = await getModelForCompany(companyId, UserModel);
    await userCompanyModel.findByIdAndUpdate(
      { _id: req.body.notification.to },
      { $pull: { notifications: { _id: req.body.notification._id } } },
      { safe: true, multi: false, upsert: false }
    );
    return res.status(200).json({ message: 'Notificação marcada como lida!' });
  } catch (err) {
    return res.status(500).json({
      message: 'Falha ao ler notificação!',
      error: err,
    });
  }
});

export default router;
