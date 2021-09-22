import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { User } from './user';
import mongooseUniqueValidator from 'mongoose-unique-validator';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';

@plugin(mongooseUniqueValidator)
export class Course extends Base<string> {
  @prop({ required: true })
  name = '';

  @prop({ required: true })
  hasCertificate = true;

  @prop({ required: true })
  courseHours = '0';

  @prop({ required: true })
  speaker: Ref<User>;

  @prop({ required: true })
  startDate: Date;

  @prop({ required: true })
  place = '';

  @prop({ required: true })
  price = '0,00';
}

export default getModelForClass(Course);
