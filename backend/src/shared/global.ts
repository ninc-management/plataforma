import { mongoose } from '@typegoose/typegoose';

export const connectionPool: Record<string, mongoose.Connection> = {};
