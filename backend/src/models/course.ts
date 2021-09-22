import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { User } from './user';
import mongooseUniqueValidator from 'mongoose-unique-validator';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';

@plugin(mongooseUniqueValidator)
export class Course extends Base<string> {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  hasCertificate!: boolean;

  @prop({ required: true })
  courseHours!: string;

  @prop({ required: true, ref: () => User })
  speaker: Ref<User>;

  @prop({ required: true })
  startDate: Date;

  @prop({ required: true })
  place!: string;

  @prop({ required: true })
  price!: string;
}

export default getModelForClass(Course);
