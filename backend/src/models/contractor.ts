import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import * as mongoose from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';

@plugin(uniqueValidator)
export class Contractor extends Base<typeof mongoose.Schema.Types.String> {
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
