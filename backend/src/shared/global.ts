import { mongoose } from '@typegoose/typegoose';

import { Prospect } from '../models/prospect';

export const prospectMap: Record<string, Prospect> = {};

export const connectionPool: Record<string, mongoose.Connection> = {};
