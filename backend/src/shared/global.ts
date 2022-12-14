import { Subject } from 'rxjs';

import { Contract } from '../models/contract';
import { Contractor } from '../models/contractor';
import { Course } from '../models/course';
import { Invoice } from '../models/invoice';
import { Message } from '../models/message';
import { Notification } from '../models/notification';
import { PlatformConfig } from '../models/platformConfig';
import { Promotion } from '../models/promotion';
import { Prospect } from '../models/prospect';
import { Provider } from '../models/provider';
import { Team } from '../models/team';
import { Transaction } from '../models/transaction';
import { User } from '../models/user';

export const usersMap: Record<string, User> = {};
export const prospectMap: Record<string, Prospect> = {};
export const contractsMap: Record<string, Contract> = {};
export const messagesMap: Record<string, Message> = {};
export const teamMap: Record<string, Team> = {};
export const promotionsMap: Record<string, Promotion> = {};
export const configMap: Record<string, PlatformConfig> = {};
export const invoicesMap: Record<string, Invoice> = {};
export const coursesMap: Record<string, Course> = {};
export const contractorsMap: Record<string, Contractor> = {};
export const notification$ = new Subject<Notification>();
export const providersMap: Record<string, Provider> = {};
export const transactionsMap: Record<string, Transaction> = {};
