import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import { Contractor } from './contractor';
import { User } from './user';
import * as uniqueValidator from 'mongoose-unique-validator';

export class InvoiceProduct {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  amount!: string;

  @prop({ required: true })
  value!: string;

  @prop({ required: true })
  total!: string;

  @prop({ required: true, default: [], type: () => [String] })
  subproducts: string[];
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
}

export class InvoiceTeamMember {
  @prop({ required: true, ref: () => User })
  user!: Ref<User>;

  @prop({ required: true })
  coordination!: string;
}

@plugin(uniqueValidator)
export class Invoice extends Base<string> {
  @prop({ required: true, ref: () => User })
  author!: Ref<User>;

  @prop({ required: true })
  department!: string;

  @prop({ required: true })
  coordination!: string;

  @prop({ required: true })
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

  @prop({ default: [], type: () => InvoiceTeamMember })
  team?: InvoiceTeamMember[];

  @prop()
  trello?: boolean;

  @prop({ required: true })
  created!: Date;

  @prop({ required: true })
  lastUpdate!: Date;

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

  @prop({ default: [], type: () => [String] })
  laep?: string[];

  @prop()
  dep?: string;

  @prop()
  peee?: string;

  @prop({ default: [], type: () => [String] })
  laee?: string[];

  @prop()
  dee?: string;

  @prop()
  peec?: string;

  @prop({ default: [], type: () => [String] })
  laec?: string[];

  @prop()
  dec?: string;

  @prop()
  discount?: string;

  @prop()
  materialListType?: string;

  @prop()
  productListType?: string;

  @prop()
  invoiceType?: string;

  @prop({ default: [], type: () => InvoiceProduct })
  products: InvoiceProduct[];

  @prop({ default: [], type: () => InvoiceStage })
  stages: InvoiceStage[];

  @prop({ default: [], type: () => InvoiceMaterial })
  materials: InvoiceMaterial[];

  @prop({ default: [], type: () => [String] })
  importants: string[];
}

export default getModelForClass(Invoice);
