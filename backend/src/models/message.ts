import { getModelForClass, prop, Ref } from '@typegoose/typegoose';
import { Base } from './base';
import { Contract } from './contract';
import { User } from './user';

export class Message extends Base<string> {
  @prop({ required: true, ref: () => Contract })
  contract: Ref<Contract>;

  @prop({ required: true, ref: () => User })
  author!: Ref<User>;

  @prop({ required: true })
  body: string = '';

  @prop({ required: true })
  created!: Date;
}

export default getModelForClass(Message);
