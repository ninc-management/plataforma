import { mongoose } from '@typegoose/typegoose';
import { Subject } from 'rxjs';

import { Company } from '../models/company';
import { Contract } from '../models/contract';
import { Contractor } from '../models/contractor';
import { Course } from '../models/course';
import { Message } from '../models/message';
import { Notification } from '../models/notification';
import { PlatformConfig } from '../models/platformConfig';
import { Prospect } from '../models/prospect';
import { Provider } from '../models/provider';
import { Team } from '../models/team';
import { User } from '../models/user';

export const usersMap: Record<string, User> = {};
export const prospectMap: Record<string, Prospect> = {};
export const contractsMap: Record<string, Contract> = {};
export const messagesMap: Record<string, Message> = {};
export const teamMap: Record<string, Team> = {};
export const configMap: Record<string, PlatformConfig> = {};
export const coursesMap: Record<string, Course> = {};
export const contractorsMap: Record<string, Contractor> = {};
export const notification$ = new Subject<Notification>();
export const providersMap: Record<string, Provider> = {};
export const companyMap: Record<string, Company> = {};
export const connectionPool: Record<string, mongoose.Connection> = {};
