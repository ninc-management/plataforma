import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { Base } from './base';
import mongooseUniqueValidator from 'mongoose-unique-validator';
import { Contract } from './contract';
import { Team } from './team';
import { Sector } from './shared';

export class UserExpertise {
  @prop({ required: true, ref: () => Sector })
  public sector!: Ref<Sector>;

  @prop({ required: true })
  public text!: string;

  @prop({ required: true })
  public shortExpertise!: string;
}

export class UserFinancialTransaction {
  @prop({ required: true, enum: ['User', 'Contract'] })
  modelFrom!: string;

  @prop({ required: true, enum: ['User', 'Team'] })
  modelTo!: string;

  @prop({ required: true, refPath: 'modelFrom' })
  from!: Ref<User | Contract>;

  @prop({ required: true, refPath: 'modelTo' })
  to!: Ref<User | Team>;

  @prop({ required: true })
  date: Date = new Date();

  @prop({ required: true })
  description!: string;

  @prop({ required: true })
  value!: string;
}

export class UserNotification extends Base<string> {
  @prop({ required: true })
  title: string = '';

  @prop({ required: true })
  message: string = '';

  @prop({ ref: () => User })
  from: Ref<User>;

  @prop({ ref: () => User })
  to: Ref<User>;

  @prop({ required: true })
  created: Date = new Date();
}

@plugin(mongooseUniqueValidator)
export class User extends Base<string> {
  @prop({ required: true })
  public fullName: string = '';

  @prop()
  public exibitionName?: string;

  @prop({ required: true, unique: true })
  public email!: string;

  @prop()
  public professionalEmail: string = 'trocar@profissional.com.br';

  @prop({ required: true })
  public phone!: string;

  @prop({ required: true })
  public article: string = 'a';

  @prop({ required: true })
  public state!: string;

  @prop({ required: true })
  public city!: string;

  @prop()
  public education?: string;

  @prop({ required: true, ref: () => Sector })
  public sectors: Ref<Sector>[] = [];

  @prop()
  public profilePicture?: string;

  @prop({ type: () => [String] })
  public position: string[] = ['Associado'];

  @prop({ required: true })
  public level: string = 'Associada Trainee';

  @prop({ unique: true })
  public document!: string;

  @prop({ type: () => [UserExpertise] })
  public expertise: UserExpertise[] = [];

  @prop({ ref: () => User })
  public AER: Ref<User>[] = [];

  @prop()
  public theme: string = 'default';

  @prop({ type: () => [UserFinancialTransaction] })
  public transactions: UserFinancialTransaction[] = [];

  @prop({ required: true })
  public active: boolean = true;

  @prop({ type: () => [UserNotification] })
  public notifications: UserNotification[] = [];
}

export default getModelForClass(User);
