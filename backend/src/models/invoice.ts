import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { Contractor } from './contractor';
import { User } from './user';
import mongooseUniqueValidator from 'mongoose-unique-validator';

export class InvoiceProduct {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  amount!: string;

  @prop({ required: true })
  value!: string;

  @prop({ required: true })
  total!: string;

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

  @prop({ required: true })
  coordination!: string;
}

@plugin(mongooseUniqueValidator)
export class Invoice extends Base<string> {
  @prop({ required: true, ref: () => User })
  author!: Ref<User>;

  @prop({ required: true })
  department!: string;

  @prop({ required: true })
  coordination!: string;

  @prop({ default: 'nortan', required: true })
  administration!: string;

  @prop({ required: true, unique: true })
  code!: string;

  @prop({ required: true })
  type!: string;

  @prop({ required: true })
  service!: string;

  @prop({ required: true, ref: () => Contractor })
  contractor!: Ref<Contractor>;

  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  value!: string;

  @prop({ required: true })
  status!: string;

  @prop({ type: () => [InvoiceTeamMember] })
  team: InvoiceTeamMember[] = [];

  @prop()
  trello?: boolean;

  @prop({ default: new Date(), required: true })
  created: Date = new Date();

  @prop({ default: new Date(), required: true })
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
  discount?: string;

  @prop({ default: '1' })
  materialListType?: string;

  @prop({ default: '1' })
  productListType?: string;

  @prop({ default: 'projeto' })
  invoiceType: string = 'projeto';

  @prop({ type: () => [InvoiceProduct] })
  products: InvoiceProduct[] = [];

  @prop({ type: () => [InvoiceStage] })
  stages: InvoiceStage[] = [];

  @prop({ type: () => [InvoiceMaterial] })
  materials: InvoiceMaterial[] = [];

  @prop({ type: () => [String] })
  importants: string[] = [];

  model = false;
  contractorName = '';
  fullName = '';
  role = 'Nenhum';
}

export default getModelForClass(Invoice);
