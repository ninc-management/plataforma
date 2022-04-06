import { Contract } from '../models/contract';
import { Contractor } from '../models/contractor';
import { Course } from '../models/course';
import { Invoice } from '../models/invoice';
import { PlatformConfig } from '../models/platformConfig';
import { Promotion } from '../models/promotion';
import { Prospect } from '../models/prospect';
import { Team } from '../models/team';
import { User } from '../models/user';

export const usersMap: Record<string, User> = {};
export const prospectMap: Record<string, Prospect> = {};
export const contractsMap: Record<string, Contract> = {};
export const teamMap: Record<string, Team> = {};
export const promotionsMap: Record<string, Promotion> = {};
export const configMap: Record<string, PlatformConfig> = {};
export const invoicesMap: Record<string, Invoice> = {};
export const coursesMap: Record<string, Course> = {};
export const contractorsMap: Record<string, Contractor> = {};