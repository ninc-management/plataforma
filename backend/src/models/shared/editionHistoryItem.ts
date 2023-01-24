import { prop, Ref } from '@typegoose/typegoose';

import { User } from '../user';

/**
 * Used by Transaction and Internal Transaction
 */
export class EditionHistoryItem {
  @prop({ required: true, ref: () => User })
  author!: Ref<User>;

  @prop({ required: true })
  comment!: string;

  @prop({ required: true })
  date: Date = new Date();
}
