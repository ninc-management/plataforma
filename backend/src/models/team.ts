import { prop, getModelForClass, Ref } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user';

export class TeamMember {
  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true })
  coordination!: string;
}

export class TeamFinancialTransaction {
  @prop({ required: true, ref: () => User })
  from!: Ref<User>;

  @prop({ required: true, ref: () => Team })
  to!: Ref<Team>;

  @prop({ required: true })
  date: Date = new Date();

  @prop({ required: true })
  description!: string;

  @prop({ required: true })
  value!: string;
}

export class Team extends Base<string> {
  @prop({ required: true })
  name!: string;

  @prop({ required: true, ref: () => User })
  leader!: Ref<User>;

  @prop({ required: true })
  expertise!: string;

  @prop({ type: () => [TeamMember] })
  members: TeamMember[] = [];

  @prop({ type: () => [TeamFinancialTransaction] })
  transactions: TeamFinancialTransaction[] = [];

  @prop({ required: true })
  created: Date = new Date();

  @prop({ required: true })
  purpose!: string;

  balance = '0,00';

  leaderName = '';
}

export default getModelForClass(Team);
