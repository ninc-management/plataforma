import { prop, getModelForClass, plugin } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import * as uniqueValidator from 'mongoose-unique-validator';

@plugin(uniqueValidator)
export class Contractor extends Base<string> {
  @prop({ required: true })
  fullName!: string;

  @prop({ required: true, unique: true })
  document!: string;

  @prop({ required: true })
  email!: string;

  @prop({ required: true })
  address!: string;
}

export default getModelForClass(Contractor);
