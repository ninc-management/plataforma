import { RefType } from '@typegoose/typegoose/lib/types';
import { Types } from 'mongoose';

export abstract class Base<T_ID extends RefType = Types.ObjectId> {
  public _id!: T_ID;
  public __v?: number;
  public __t?: string | number;
}
