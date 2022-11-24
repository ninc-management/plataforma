import { prop, Ref } from '@typegoose/typegoose';

import { Base } from './base';
import { Provider } from './provider';
import { Sector, UploadedFile } from './shared';
import { Transaction } from './transaction';
import { User } from './user';

export interface TeamLocals {
  balance: string;
  leaderName: string;
}

export class TeamMember {
  @prop({ required: true, ref: () => User })
  user: Ref<User> = new User();

  @prop({ required: true, ref: () => Sector })
  sectors: Ref<Sector>[] = [];
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

  @prop({ required: true })
  created: Date = new Date();

  @prop({ required: true })
  purpose!: string;

  @prop({ ref: () => Transaction })
  expenses: Ref<Transaction>[] = [];

  @prop({ required: true })
  config: TeamConfig = new TeamConfig();

  @prop({ required: true })
  abrev!: string;

  @prop({ required: true })
  isOrganizationTeam: boolean = false;

  @prop({ required: true, type: () => [Sector] })
  sectors: Sector[] = [];

  @prop({ required: true })
  overrideSupportPercentages: boolean = false;

  @prop({ required: true })
  overrideIntermediationPercentages: boolean = false;

  @prop()
  supportOrganizationPercentage?: string;

  @prop()
  supportNfPercentage?: string;

  @prop()
  intermediationOrganizationPercentage?: string;

  @prop()
  intermediationNfPercentage?: string;

  locals: TeamLocals = {
    balance: '0,00',
    leaderName: '',
  };
}
