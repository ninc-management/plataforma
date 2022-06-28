import { getModelForClass, prop, Ref } from '@typegoose/typegoose';

import { Base } from './base';
import { Sector, UploadedFile } from './shared';
import { User } from './user';

export class TeamMember {
  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true, ref: () => Sector })
  sectors!: Ref<Sector>[];
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
  nf: boolean = true;

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

export class TeamConfig {
  @prop({ required: true })
  path: string = '';
}

export class Team extends Base<string> {
  @prop({ required: true })
  name!: string;

  @prop({ ref: () => User })
  leader?: Ref<User>;

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
  config: TeamConfig = new TeamConfig();

  @prop({ required: true })
  abrev!: string;

  @prop({ required: true })
  isOrganizationTeam: boolean = false;

  @prop({ required: true, type: () => [Sector] })
  sectors: Sector[] = [];

  @prop({ required: true })
  overridePercentages: boolean = false;

  @prop()
  organizationPercentage?: string;

  @prop()
  nfPercentage?: string;

  balance = '0,00';

  leaderName = '';
}

export default getModelForClass(Team);
