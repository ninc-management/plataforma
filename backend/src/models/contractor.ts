import { getModelForClass, plugin, prop } from '@typegoose/typegoose';
import mongooseUniqueValidator from 'mongoose-unique-validator';

import { Base } from './base';

@plugin(mongooseUniqueValidator)
export class Contractor extends Base<string> {
  @prop({ required: true })
  fullName!: string;

  @prop({ required: true, unique: true })
  document!: string;

  @prop({ required: true })
  email!: string;

  @prop({ required: true })
  address!: string;

  @prop({ required: true })
  phone!: string;
}

export default getModelForClass(Contractor);
