import { prop, getModelForClass, Ref } from '@typegoose/typegoose';
import { Base } from './base';
import { User } from './user';
import { EditionHistoryItem } from './shared';
import { Contract } from './contract';
import { Team } from './team';

export class InternalTransaction extends Base<string> {
  @prop({ required: true, enum: ['User', 'Contract', 'Team'] })
  modelFrom!: string;

  @prop({ required: true, enum: ['User', 'Contract', 'Team'] })
  modelTo!: string;

  @prop({ required: true, ref: () => User })
  author!: Ref<User>;

  @prop({ required: true, refPath: 'modelFrom' })
  from!: Ref<User | Contract | Team>;

  @prop({ required: true, refPath: 'modelTo' })
  to!: Ref<User | Contract | Team>;

  @prop({ required: true })
  description!: string;

  @prop({ required: true })
  type!: string;

  @prop({ required: true })
  value!: string;

  @prop({ required: true })
  created: Date = new Date();

  @prop({ required: true })
  lastUpdate: Date = new Date();

  @prop({ required: true })
  paid: boolean = false;

  @prop({ required: true })
  code!: string;

  @prop()
  paidDate?: Date;

  @prop({ type: () => [EditionHistoryItem] })
  editionHistory: EditionHistoryItem[] = [];
}

export default getModelForClass(InternalTransaction);
