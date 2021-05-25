import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { User } from './user';
import { Invoice } from './invoice';
import * as uniqueValidator from 'mongoose-unique-validator';

export class ContractUploadedFile {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  url!: string;
}

export class ContractExpenseTeamMember {
  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true })
  value!: string;

  @prop({ required: true })
  percentage!: string;

  @prop({ required: true })
  coordination!: string;
}

export class ContractExpense {
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

  @prop({ required: true })
  splitType!: string;

  @prop({ required: true })
  value!: string;

  @prop({ required: true })
  created!: Date;

  @prop({ required: true })
  lastUpdate!: Date;

  @prop({ required: true })
  paid!: boolean;

  @prop()
  paidDate?: Date;

  @prop({ default: [], type: () => ContractUploadedFile })
  uploadedFiles!: ContractUploadedFile[];

  @prop({ default: [], type: () => ContractExpenseTeamMember })
  team!: ContractExpenseTeamMember[];
}

export class ContractUserPayment {
  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true })
  coordination!: string;

  @prop({ required: true })
  value!: string;

  percentage!: string;
}

export class ContractPayment {
  @prop({ required: true })
  service!: string;

  @prop({ required: true })
  value!: string;

  @prop({ default: [], type: () => ContractUserPayment })
  team!: ContractUserPayment[];

  @prop({ required: true })
  created!: Date;

  @prop({ required: true })
  lastUpdate!: Date;

  @prop({ required: true })
  paid!: boolean;

  @prop()
  paidDate?: Date;
}

export class ContractReceipt {
  @prop({ required: true })
  description!: string;

  @prop({ required: true })
  value!: string;

  @prop({ required: true })
  notaFiscal!: string;

  @prop({ required: true })
  nortanPercentage!: string;

  @prop({ required: true })
  created!: Date;

  @prop({ required: true })
  lastUpdate!: Date;

  @prop({ required: true })
  paid!: boolean;

  @prop()
  paidDate?: Date;
}

export class ContractTeamMember {
  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true })
  coordination!: string;

  @prop({ required: true })
  distribution!: string;
}

@plugin(uniqueValidator)
export class Contract extends Base<string> {
  @prop({ required: true, ref: () => Invoice })
  invoice!: Ref<Invoice>;

  @prop({ default: [], type: () => ContractPayment })
  payments!: ContractPayment[];

  @prop({ default: [], type: () => ContractReceipt })
  receipts!: ContractReceipt[];

  @prop({ default: [], type: () => ContractExpense })
  expenses!: ContractExpense[];

  @prop({ required: true })
  status!: string;

  @prop({ required: true })
  version!: string;

  @prop({ required: true })
  ISS!: string;

  @prop({ required: true })
  total?: string;

  @prop({ required: true })
  created!: Date;

  @prop({ required: true })
  lastUpdate!: Date;

  @prop({ default: [], type: () => ContractTeamMember })
  team!: ContractTeamMember[];

  balance = '';
  value = '';
}

export default getModelForClass(Contract);
