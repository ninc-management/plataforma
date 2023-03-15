import { mongoose } from '@typegoose/typegoose';
import { Subject } from 'rxjs';

import { Company } from '../models/company';
import { Notification } from '../models/notification';
import { PlatformConfig } from '../models/platformConfig';
import { Prospect } from '../models/prospect';
import { User } from '../models/user';

export const usersMap: Record<string, User> = {};
export const prospectMap: Record<string, Prospect> = {};
export const configMap: Record<string, PlatformConfig> = {};
export const notification$ = new Subject<Notification>();
export const companyMap: Record<string, Company> = {};
export const connectionPool: Record<string, mongoose.Connection> = {};
