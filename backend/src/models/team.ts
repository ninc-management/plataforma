import { prop, getModelForClass, Ref } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user';

export class TeamMember {
  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true })
  coordination!: string;
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

  @prop({ required: true })
  balance: string = '0,00';

  leaderName = '';
}

export default getModelForClass(Team);
