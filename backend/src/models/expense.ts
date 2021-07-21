import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user';
import { UploadedFile } from './contract';
import mongooseUniqueValidator from 'mongoose-unique-validator';

@plugin(mongooseUniqueValidator)
export class Expense extends Base<string> {
  @prop({ required: true, ref: () => User })
  author!: Ref<User>;

  @prop({ required: true, ref: () => User })
  source!: Ref<User>;

  @prop({ required: true })
  description!: string;

  @prop({ required: true })
  nf: boolean = true;

  @prop({ required: true })
  type!: string;

  @prop()
  fixedType: string = '';

  @prop({ required: true })
  value!: string;

  @prop({ required: true })
  created: Date = new Date();

  @prop({ required: true })
  lastUpdate: Date = new Date();

  @prop({ required: true })
  paid: boolean = true;

  @prop({ required: true, unique: true })
  code!: string;

  @prop()
  paidDate?: Date;

  @prop({ type: () => [UploadedFile] })
  uploadedFiles: UploadedFile[] = [];
}

export default getModelForClass(Expense);
