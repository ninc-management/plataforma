import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { Invoice } from './invoice';
import { StatusHistory } from './baseStatusHistory';
import { Sector, UploadedFile } from './shared';
import { User } from './user';
import mongooseUniqueValidator from 'mongoose-unique-validator';

export class ContractExpenseTeamMember {
  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true })
  value!: string;

  @prop({ required: true })
  percentage!: string;

  @prop({ required: true, ref: () => Sector })
  sector!: Ref<Sector>;
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

  @prop({ required: true, ref: () => Sector })
  sector!: Ref<Sector>;

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

export class DateRange {
  @prop({ required: true })
  start!: Date;

  @prop({ required: true })
  end?: Date;
}

export class ChecklistItemAction {
  @prop({ required: true })
  name!: string;

  @prop({ required: true, _id: false })
  range!: DateRange;

  @prop({ required: true, ref: () => User })
  assignee: Ref<User>;

  @prop({ required: true })
  isFinished: boolean = false;

  @prop()
  finishedDate?: Date;

  isNew: boolean = true;
  parentItemName: string = '';
}

export class ContractChecklistItem {
  @prop({ required: true })
  name!: string;

  @prop({ required: true, _id: false })
  range!: DateRange;

  @prop({ required: true, ref: () => User })
  assignee: Ref<User>;

  @prop({ required: true })
  status!: string;

  @prop({ required: true })
  description: string = '';

  @prop({ type: () => [ChecklistItemAction] })
  actionList: ChecklistItemAction[] = [];

  isNew: boolean = true;
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

  @prop({ required: true })
  createdExpenses: number = 0;

  @prop({ type: () => [ContractChecklistItem] })
  checklist: ContractChecklistItem[] = [];

  @prop()
  managementStatus: string = '';

  @prop()
  managementNotes: string = '';

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
