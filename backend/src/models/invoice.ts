import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { Contractor } from './contractor';
import { User } from './user';
import { StatusHistory } from './baseStatusHistory';
import mongooseUniqueValidator from 'mongoose-unique-validator';
import { Sector } from './shared';
import { Team } from './team';

export class InvoiceProduct {
  @prop({ required: true })
  name: string = '';

  @prop({ required: true })
  amount: string = '';

  @prop()
  unit: string = '';

  @prop({ required: true })
  value: string = '';

  @prop({ required: true })
  total: string = '';

  @prop({ required: true, type: () => [String] })
  subproducts: string[] = [];

  percentage = '';
}

export class InvoiceMaterial {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  amount!: string;

  @prop({ required: true })
  value!: string;

  @prop({ required: true })
  total!: string;
}

export class InvoiceStage {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  value!: string;

  percentage = '';
}

export class InvoiceTeamMember {
  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true, ref: () => Sector })
  sector!: Ref<Sector>;

  @prop({ required: true })
  distribution!: string;

  netValue = '0,00';
  grossValue = '0,00';
}

@plugin(mongooseUniqueValidator)
export class Invoice extends StatusHistory {
  @prop({ required: true, ref: () => User })
  author!: Ref<User>;

  @prop({ required: true, ref: () => Team })
  nortanTeam!: Ref<Team>;

  @prop({ required: true, ref: () => Sector })
  sector!: Ref<Sector>;

  @prop({ required: true })
  administration: string = 'nortan';

  @prop({ required: true, unique: true })
  code!: string;

  @prop({ required: true })
  type: string = 'projeto';

  @prop({ required: true })
  service!: string;

  @prop({ required: true, ref: () => Contractor })
  contractor!: Ref<Contractor>;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  value!: string;

  @prop({ type: () => [InvoiceTeamMember] })
  team: InvoiceTeamMember[] = [];

  @prop()
  trello?: boolean;

  @prop({ required: true })
  created: Date = new Date();

  @prop({ required: true })
  lastUpdate: Date = new Date();

  @prop()
  subtitle1?: string;

  @prop()
  subtitle2?: string;

  @prop()
  contactName?: string;

  @prop()
  contactPlural?: boolean;

  @prop()
  contractorFullName?: string;

  @prop()
  subject?: string;

  @prop()
  peep?: string;

  @prop({ type: () => [String] })
  laep: string[] = [];

  @prop()
  dep?: string;

  @prop()
  peee?: string;

  @prop({ type: () => [String] })
  laee: string[] = [];

  @prop()
  dee?: string;

  @prop()
  peec?: string;

  @prop({ type: () => [String] })
  laec: string[] = [];

  @prop()
  dec?: string;

  @prop()
  discount?: string = '0,00';

  @prop()
  materialListType: string = '1';

  @prop()
  productListType: string = '2';

  @prop()
  invoiceType: string = 'projeto';

  @prop({ type: () => [InvoiceProduct] })
  products: InvoiceProduct[] = [];

  @prop({ type: () => [InvoiceStage] })
  stages: InvoiceStage[] = [];

  @prop({ type: () => [InvoiceMaterial] })
  materials: InvoiceMaterial[] = [];

  @prop({ type: () => [String] })
  importants: string[] = [];

  @prop({ required: true, ref: () => User })
  prospectedBy!: Ref<User>;

  model = false;
  contractorName = '';
  fullName = '';
  role = 'Nenhum';
}

export default getModelForClass(Invoice);
