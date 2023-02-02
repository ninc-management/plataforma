import { ModelType } from '@typegoose/typegoose/lib/types';
import { differenceInDays } from 'date-fns';

import ContractModel, { Contract } from '../models/contract';
import InvoiceModel, { Invoice } from '../models/invoice';
import { Notification, NotificationTags } from '../models/notification';
import UserModel, { User } from '../models/user';
import { sendMail } from '../routes/email';
import { updateNotification } from '../routes/notification';
import { configMap } from './global';

function createId(): string {
  const timestamp = ((new Date().getTime() / 1000) | 0).toString(16);
  return (
    timestamp +
    'xxxxxxxxxxxxxxxx'
      .replace(/[x]/g, function () {
        return ((Math.random() * 16) | 0).toString(16);
      })
      .toLowerCase()
  );
}

function port(port: string, fallback = '8080'): string {
  return !isNaN(+port) && +port >= 0 ? port : fallback;
}

export function isUserAuthenticated(req, res, next): boolean {
  const urlCheck = req.url.split('/').filter((el) => el.length > 0);
  if (urlCheck.length > 0 && urlCheck[0] == 'api') {
    if (req.headers.authorization == process.env.API_TOKEN) {
      next();
    } else {
      return res.status(401).json({
        message: 'Chave de autenticação da API invalida',
      });
    }
  } else next();
}

export function notifyByEmail(notification: Notification): void {
  const mailOptions = {
    from: 'Contato NINC <contato@ninc.digital>',
    to: (notification.to as User).email,
    subject: notification.title,
    html: '<p>' + notification.message + '</p>',
  };
  sendMail(mailOptions, (err, info) => {
    if (err) console.log('Erro envio de mail:', err);
  });
}

function sendNotification(invoice: Invoice, author: User, days: number): void {
  const notification = new Notification();
  notification.title = 'Pagamento pendente';
  notification.message =
    days > 0
      ? `A data prevista para o pagamento de uma das parcelas da ordem de empenho do contrato ${invoice.code} já passou fazem ${days} dias.`
      : `Faltam ${
          days * -1
        } dias para a data prevista do pagamento de uma das parcelas da ordens de empenho do contrato ${invoice.code}.`;
  notification.tag = 'receipt-due';
  notification.to = author._id;
  notification.from = author._id;
  updateNotification(notification, undefined);
}

export async function overdueReceiptNotification() {
  const contracts: Contract[] = await ContractModel.find({});
  contracts.map((contract) => {
    contract.receipts.map(async (receipt) => {
      const dueDate = receipt.dueDate;
      if (dueDate && !receipt.paid) {
        const invoice = await InvoiceModel.findOne({ _id: contract.invoice });
        const author = await UserModel.findOne({ _id: invoice.author });
        const days = differenceInDays(new Date().getTime(), dueDate.getTime());
        if (days == -3) {
          sendNotification(invoice, author, days);
        } else if (days % 3 == 0 && days > 0) {
          sendNotification(invoice, author, days);
        }
      }
    });
  });
}

export async function isNotificationEnabled(notificationTag: string, platform: string): Promise<boolean> {
  const platformConfig = configMap[Object.keys(configMap)[0]];
  if (platformConfig != undefined) {
    switch (notificationTag) {
      case NotificationTags.APPOINTED_AS_ASSIGNEE:
        return platformConfig.notificationConfig.stageResponsible[platform];
      case NotificationTags.CONTRACT_SIGNED:
        return platformConfig.notificationConfig.contractClosed[platform];
      case NotificationTags.MENTION:
        return platformConfig.notificationConfig.userMentioned[platform];
      case NotificationTags.RECEIPT_DUE:
        return platformConfig.notificationConfig.receiptDue[platform];
      case NotificationTags.VALUE_TO_RECEIVE_PAID:
        return platformConfig.notificationConfig.teamMemberPaid[platform];
      case NotificationTags.EXPENSE_ORDER_CREATED ||
        NotificationTags.PAYMENT_ORDER_CREATED ||
        NotificationTags.RECEIPT_ORDER_CREATED:
        return platformConfig.notificationConfig.transactionCreated[platform];
      case NotificationTags.EXPENSE_PAID || NotificationTags.PAYMENT_ORDER_PAID || NotificationTags.RECEIPT_PAID:
        return platformConfig.notificationConfig.transactionPaid[platform];
      default:
        return false;
    }
  }
  return false;
}

export function getModelForDb<T>(connection: any, model: ModelType<T>): ModelType<T> {
  const DbModel = connection.model(model.modelName, model.schema) as ModelType<T>;

  return DbModel;
}

export default {
  mongoObjectId: createId,
  normalizePort: port,
};
