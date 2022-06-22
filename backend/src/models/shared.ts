import { getModelForClass, prop, Ref } from '@typegoose/typegoose';

import { Base } from './base';
import { User } from './user';

/**
 * Used by User and Team
 */
export class Sector extends Base<string> {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  abrev!: string;

  isChecked = false;
}

/**
 * Used by Contract and Team
 */
export class UploadedFile {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  url!: string;
}

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
