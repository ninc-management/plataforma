import { getModelForClass, prop, Ref } from '@typegoose/typegoose';

import { Base } from './base';
import { Company } from './company';
import { ExpenseType } from './team';

export type EventsChecker<T extends object> = {
  isUpdated: boolean;
  newEvents: T[];
};

export class FeesPercentages {
  @prop({ required: true })
  organizationPercentage: string = '0,00';

  @prop({ required: true })
  nfPercentage: string = '0,00';
}

export class BusinessFees {
  @prop({ required: true })
  intermediation: FeesPercentages = new FeesPercentages();

  @prop({ required: true })
  support: FeesPercentages = new FeesPercentages();
}

export class Resources {
  @prop({ required: true })
  dashboard: string[] = [];

  @prop({ required: true })
  perfil: string[] = [];

  @prop({ required: true })
  configurações: string[] = [];

  @prop({ required: true })
  usuário: string[] = [];

  @prop({ required: true })
  orçamentos: string[] = [];

  @prop({ required: true })
  contratos: string[] = [];

  @prop({ required: true })
  clientes: string[] = [];

  @prop({ required: true })
  fornecedores: string[] = [];

  @prop({ required: true })
  times: string[] = [];

  @prop({ required: true })
  cursos: string[] = [];

  @prop({ required: true })
  promoções: string[] = [];
}

export class AccessControl {
  @prop({ required: true })
  roleTypeName: string = '';

  @prop({ required: true })
  permission: Resources = new Resources();
}

export class ProfileConfig {
  @prop({ required: true, type: () => [AccessControl] })
  positions: AccessControl[] = [];

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
  hasProvider: boolean = true;

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

  @prop({ required: true })
  hasMarketingPage: boolean = false;

  @prop({ required: true, type: () => [String] })
  units: string[] = [];

  @prop({ required: true })
  codeAbbreviation: string = ' ';

  @prop({ required: true })
  businessFees: BusinessFees = new BusinessFees();

  @prop({ required: true })
  importantBlockFontColor: 'black' | 'white' = 'black';

  @prop({ required: true })
  isImportantBlockFontBold: boolean = false;
}

export class ModulesConfig {
  @prop({ required: true })
  hasPromotion: boolean = true;

  @prop({ required: true })
  hasCourse: boolean = true;
}

export class OneDriveFolderConfig {
  @prop()
  oneDriveId?: string;

  @prop()
  folderId?: string;
}

export class OneDriveConfig {
  @prop({ required: true })
  isActive: boolean = false;

  @prop()
  contracts: OneDriveFolderConfig = new OneDriveFolderConfig();

  @prop()
  providerFiles: OneDriveFolderConfig = new OneDriveFolderConfig();

  @prop()
  teamTransactions: OneDriveFolderConfig = new OneDriveFolderConfig();
}

export class NotificationConfigTuple {
  @prop({ required: true })
  email: boolean = true;

  @prop({ required: true })
  platform: boolean = true;
}

export class NotificationConfig {
  @prop({ required: true })
  contractClosed: NotificationConfigTuple = new NotificationConfigTuple();

  @prop({ required: true })
  userMentioned: NotificationConfigTuple = new NotificationConfigTuple();

  @prop({ required: true })
  transactionCreated: NotificationConfigTuple = new NotificationConfigTuple();

  @prop({ required: true })
  transactionPaid: NotificationConfigTuple = new NotificationConfigTuple();

  @prop({ required: true })
  teamMemberPaid: NotificationConfigTuple = new NotificationConfigTuple();

  @prop({ required: true })
  receiptDue: NotificationConfigTuple = new NotificationConfigTuple();

  @prop({ required: true })
  stageResponsible: NotificationConfigTuple = new NotificationConfigTuple();
}

export class ExpenseConfig {
  @prop({ required: true, type: () => [ExpenseType] })
  adminExpenseTypes: ExpenseType[] = [];

  @prop({ required: true, type: () => [ExpenseType] })
  contractExpenseTypes: ExpenseType[] = [];

  @prop({ required: true })
  isDuplicated: boolean = false;
}

export class PlatformConfig extends Base<string> {
  @prop({ required: true })
  expenseConfig: ExpenseConfig = new ExpenseConfig();

  @prop({ required: true })
  invoiceConfig: InvoiceConfig = new InvoiceConfig();

  @prop({ required: true })
  profileConfig: ProfileConfig = new ProfileConfig();

  @prop({ required: true })
  modulesConfig: ModulesConfig = new ModulesConfig();

  @prop({ required: true })
  oneDriveConfig: OneDriveConfig = new OneDriveConfig();

  @prop({ required: true })
  notificationConfig: NotificationConfig = new NotificationConfig();

  @prop({ required: true, ref: () => Company })
  company!: Ref<Company>;

  @prop({ required: true })
  version!: string;
}

export default getModelForClass(PlatformConfig);
