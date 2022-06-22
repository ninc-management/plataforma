import { getModelForClass, plugin, prop, Ref } from '@typegoose/typegoose';
import mongooseUniqueValidator from 'mongoose-unique-validator';

import { Base } from './base';

export class CourseResource extends Base<string> {
  @prop({ required: true })
  name: string = '';

  @prop({ required: true })
  url: string = '';
}

export class CourseParticipant extends Base<string> {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  isSpeaker: boolean = false;

  @prop({ required: true })
  email!: string;

  @prop({ required: true })
  date!: Date;

  @prop({ required: true })
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

  @prop({ required: true, type: () => CourseParticipant })
  speaker!: CourseParticipant;

  @prop({ required: true })
  startDate!: Date;

  @prop({ required: true })
  place!: string;

  @prop({ required: true })
  price!: string;

  @prop({ type: () => [CourseParticipant] })
  participants: CourseParticipant[] = [];

  @prop({ required: true, type: () => [CourseResource] })
  resources: CourseResource[] = [];

  participantsQuantity = '';
}

export default getModelForClass(Course);
