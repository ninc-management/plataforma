import { getModelForClass } from '@typegoose/typegoose';

import { Contract } from './contract';
import { Contractor } from './contractor';
import { Course } from './course';
import { InternalTransaction } from './internalTransaction';
import { Invoice } from './invoice';
import { Message } from './message';
import { Notification } from './notification';
import { PlatformConfig } from './platformConfig';
import { Promotion } from './promotion';
import { Prospect } from './prospect';
import { Provider } from './provider';
import { Team } from './team';
import { Transaction } from './transaction';
import { User } from './user';

// This file was created to solve a node/javascript circular dependency.
// https://typegoose.github.io/typegoose/docs/guides/advanced/reference-other-classes/#circular-dependencies
export const ContractModel = getModelForClass(Contract);
export const ContractorModel = getModelForClass(Contractor);
export const CourseModel = getModelForClass(Course);
export const InternalTransactionModel = getModelForClass(InternalTransaction);
export const InvoiceModel = getModelForClass(Invoice);
export const MessageModel = getModelForClass(Message);
export const NotificationModel = getModelForClass(Notification);
export const PlatformConfigModel = getModelForClass(PlatformConfig);
export const PromotionModel = getModelForClass(Promotion);
export const ProspectModel = getModelForClass(Prospect);
export const ProviderModel = getModelForClass(Provider);
export const TeamModel = getModelForClass(Team);
export const TransactionModel = getModelForClass(Transaction);
export const UserModel = getModelForClass(User);
