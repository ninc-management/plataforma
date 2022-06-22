import { getModelForClass, prop, Ref } from '@typegoose/typegoose';

import { Base } from './base';
import { User } from './user';

export enum NotificationTags {
  MENTION = 'mention',
  EXPENSE_PAID = 'expense-paid',
  PAYMENT_ORDER_PAID = 'payment-order-paid',
  RECEIPT_PAID = 'receipt-paid',
  CONTRACT_SIGNED = 'contract-signed',
  APPOINTED_AS_ASSIGNEE = 'appointed-as-assignee',
  VALUE_TO_RECEIVE_PAID = 'value-to-receive-paid',
  EXPENSE_ORDER_CREATED = 'expense-order-created',
  PAYMENT_ORDER_CREATED = 'payment-order-created',
  RECEIPT_ORDER_CREATED = 'receipt-order-created',
  RECEIPT_DUE = 'receipt-due',
}

export enum NotificationApps {
  EMAIL = 'email',
  PLATFORM = 'platform',
  WHATSAPP = 'whatsapp',
  SLACK = 'slack',
}

export class Notification extends Base<string> {
  @prop({ required: true })
  title: string = '';

  @prop({ required: true })
  message: string = '';

  @prop({ ref: () => 'User' })
  from: Ref<User>;

  @prop({ ref: () => 'User' })
  to: Ref<User>;

  @prop({ required: true })
  tag: string = '';

  @prop({ required: true })
  created: Date = new Date();
}

export default getModelForClass(Notification);
