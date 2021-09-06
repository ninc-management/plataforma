import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { User } from './user';
import { Invoice } from './invoice';
import { StatusHistory } from './baseStatusHistory';
import mongooseUniqueValidator from 'mongoose-unique-validator';

export class UploadedFile {
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

  @prop({ type: () => [ContractExpenseTeamMember] })
  team: ContractExpenseTeamMember[] = [];
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

  @prop({ type: () => [ContractUserPayment] })
  team: ContractUserPayment[] = [];

  @prop({ required: true })
  created: Date = new Date();

  @prop({ required: true })
  lastUpdate: Date = new Date();

  @prop({ required: true })
  paid: boolean = false;

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
  created: Date = new Date();

  @prop({ required: true })
  lastUpdate: Date = new Date();

  @prop({ required: true })
  paid: boolean = false;

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

  netValue = '0,00';
  grossValue = '0,00';
}

@plugin(mongooseUniqueValidator)
export class Contract extends StatusHistory {
  @prop({ required: true, ref: () => Invoice })
  invoice!: Ref<Invoice>;

  @prop({ type: () => [ContractPayment] })
  payments: ContractPayment[] = [];

  @prop({ type: () => [ContractReceipt] })
  receipts: ContractReceipt[] = [];

  @prop({ type: () => [ContractExpense] })
  expenses: ContractExpense[] = [];

  @prop({ required: true })
  status: string = 'Em andamento';

  @prop({ required: true })
  version: string = '00';

  @prop({ required: true })
  ISS: string = '0,00';

  @prop({ required: true })
  total: string = '1';

  @prop({ required: true })
  created: Date = new Date();

  @prop({ required: true })
  lastUpdate: Date = new Date();

  @prop({ type: () => [ContractTeamMember] })
  team: ContractTeamMember[] = [];

  @prop({ required: true })
  createdExpenses: number = 0;

  balance = '';
  value = '';
  fullName = '';
  code = '';
  contractor = '';
  name = '';
  interests = '';
  role = '';
  notPaid = '';
  liquid = '';
  cashback = '';
  managerPicture = '';
}

export default getModelForClass(Contract);
