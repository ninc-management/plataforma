import { prop, getModelForClass, Ref } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user';

export class Team extends Base<string> {
  @prop({ required: true })
  name!: string;

  @prop({ required: true, ref: () => User })
  leader!: Ref<User>;

  @prop({ required: true })
  expertise!: string;

  @prop({ ref: () => User })
  members: Ref<User>[] = [];

  leaderName = '';
}

export default getModelForClass(Team);
