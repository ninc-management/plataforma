import { prop, getModelForClass, Ref } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user';
import { UploadedFile } from './contract';

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

export class TeamExpense {
  @prop({ required: true, ref: () => User })
  author!: Ref<User>;

  @prop({ required: true, ref: () => User })
  source!: Ref<User>;

  @prop({ required: true })
  description!: string;

  @prop({ required: true })
  nf!: boolean;

  @prop({ required: true })
  type!: string;

  @prop()
  subType: string = '';

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

  @prop({ type: () => [UploadedFile] })
  uploadedFiles: UploadedFile[] = [];
}

export class ExpenseType {
  @prop({ required: true })
  name!: string;

  @prop({ required: true, type: () => [String] })
  subTypes: string[] = [];
}

export class TeamExpenseConfig {
  @prop({ type: () => [ExpenseType] })
  types: ExpenseType[] = [];
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

  @prop({ type: () => [TeamExpense] })
  expenses: TeamExpense[] = [];

  @prop({ required: true })
  config: TeamExpenseConfig = new TeamExpenseConfig();

  balance = '0,00';

  leaderName = '';
}

export default getModelForClass(Team);
