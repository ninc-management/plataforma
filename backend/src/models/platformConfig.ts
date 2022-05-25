import { prop, getModelForClass } from '@typegoose/typegoose';
import { Base } from './base';
import { ExpenseType } from './team';

export class AccessControl {
  @prop({ required: true })
  roleTypeName: string = '';

  @prop({ required: true })
  permission: string = '';
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
  codeAbbreviation: string = ' ';
}

export class SocialConfig {
  @prop({ required: true })
  youtubeLink: string = '';

  @prop({ required: true })
  linkedinLink: string = '';

  @prop({ required: true })
  instagramLink: string = '';

  @prop({ required: true })
  glassfrogLink: string = '';

  @prop({ required: true })
  gathertownLink: string = '';

  @prop({ required: true })
  companyName: string = '';
}

export class ModulesConfig {
  @prop({ required: true })
  hasPromotion: boolean = true;

  @prop({ required: true })
  hasCourse: boolean = true;
}

export class OneDrive {
  @prop({ required: true })
  isActive: boolean = false;

  @prop()
  oneDriveId?: string;

  @prop()
  folderId?: string;
}

export class PlatformConfig extends Base<string> {
  @prop({ required: true, type: () => [ExpenseType] })
  expenseTypes: ExpenseType[] = [];

  @prop({ required: true })
  invoiceConfig: InvoiceConfig = new InvoiceConfig();

  @prop({ required: true })
  profileConfig: ProfileConfig = new ProfileConfig();

  @prop({ required: true })
  socialConfig: SocialConfig = new SocialConfig();

  @prop({ required: true })
  modulesConfig: ModulesConfig = new ModulesConfig();

  @prop({ required: true })
  oneDriveConfig: OneDrive = new OneDrive();
}

export default getModelForClass(PlatformConfig);
