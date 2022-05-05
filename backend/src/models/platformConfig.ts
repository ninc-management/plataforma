import { prop, getModelForClass } from '@typegoose/typegoose';
import { Base } from './base';
import { ExpenseType } from './team';

export class AcessControl {
  @prop({ required: true })
  typeName: string = '';

  @prop({ required: true })
  permission: string = '';
}

export class ProfileConfig {
  @prop({ required: true, type: () => [AcessControl] })
  positions: AcessControl[] = [];

  @prop({ required: true })
  hasLevels: boolean = true;

  @prop({ required: true, type: () => [String] })
  levels: string[] = [];

  @prop({ required: true })
  hasTeam: boolean = true;

  @prop({ required: true })
  hasSector: boolean = true;

  @prop({ required: true })
  hasExpertiseBySector: boolean = true;
}

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

  @prop({ required: true })
  profileConfig: ProfileConfig = new ProfileConfig();
}

export default getModelForClass(PlatformConfig);
