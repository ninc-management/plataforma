import { prop, getModelForClass, Ref } from '@typegoose/typegoose';
import { Base } from './base';

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
