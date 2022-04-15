import { prop, getModelForClass } from '@typegoose/typegoose';
import { Base } from './base';
import { ExpenseType } from './team';

export class InvoiceConfig {
  @prop({ required: true })
  hasType: boolean = true;

  @prop({ required: true })
  hasHeader: boolean = true;

  @prop({ required: true })
  hasTeam: boolean = true;

  @prop({ required: true })
  hasPreliminary: boolean = true;

  @prop({ required: true })
  hasExecutive: boolean = true;

  @prop({ required: true })
  hasComplementary: boolean = true;

  @prop({ required: true })
  hasStageName: boolean = true;

  @prop({ required: true })
  hasImportants: boolean = true;

  @prop({ required: true })
  hasMaterialList: boolean = true;
}

export class PlatformConfig extends Base<string> {
  @prop({ required: true, type: () => [ExpenseType] })
  expenseTypes: ExpenseType[] = [];

  @prop({ required: true })
  invoiceConfig: InvoiceConfig = new InvoiceConfig();
}

export default getModelForClass(PlatformConfig);
