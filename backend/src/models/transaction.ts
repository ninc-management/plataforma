import { getModelForClass, prop, Ref } from '@typegoose/typegoose';

import { Base } from './base';
import { Contract } from './contract';
import { Provider } from './provider';
import { EditionHistoryItem } from './shared/editionHistoryItem';
import { UploadedFile } from './shared/uploadedFiles';
import { Team } from './team';
import { User } from './user';

export enum COST_CENTER_TYPES {
  USER = 'User',
  TEAM = 'Team',
}

export class Transaction extends Base<string> {
  @prop({ required: true, enum: [COST_CENTER_TYPES.USER, COST_CENTER_TYPES.TEAM] })
  modelCostCenter!: string;

  @prop({ required: true, ref: () => User })
  author!: Ref<User>;

  @prop({ required: true, refPath: 'modelCostCenter' })
  costCenter!: Ref<User | Team>;

  @prop({ ref: () => Provider })
  provider?: Ref<Provider>;

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
  notaFiscal?: string;

  @prop({ required: true })
  companyPercentage?: string;

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

  @prop({ ref: () => Contract })
  contract?: Ref<Contract>;

  @prop({ type: () => [UploadedFile] })
  uploadedFiles: UploadedFile[] = [];

  @prop({ type: () => [EditionHistoryItem] })
  editionHistory: EditionHistoryItem[] = [];
}

export default getModelForClass(Transaction);
