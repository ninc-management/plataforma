import { prop, getModelForClass, plugin } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import mongooseUniqueValidator from 'mongoose-unique-validator';

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
