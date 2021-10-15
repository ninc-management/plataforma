import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { User } from './user';
import mongooseUniqueValidator from 'mongoose-unique-validator';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';

export class CourseParticipant {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  isSpeaker!: boolean;

  @prop({required: true })
  email!: string;

  @prop({required: true })
  date!: Date;

  @prop({required: true })
  phone!: string;

  @prop({ required: true })
  CPF!: string;

  @prop({ required: true })
  address!: string;

  @prop({ required: true })
  job!: string;
}

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
  startDate!: Date;

  @prop({ required: true })
  place!: string;

  @prop({ required: true })
  price!: string;

  @prop({ type: () => [CourseParticipant] })
  participants: CourseParticipant[] = [];

  participantsQuantity = '';
}

export default getModelForClass(Course);
