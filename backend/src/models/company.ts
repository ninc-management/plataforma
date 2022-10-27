import { getModelForClass, prop } from '@typegoose/typegoose';

import { Base } from './base';
import { UploadedFile } from './shared';

export class ColorShades {
  @prop({ required: true })
  color100!: string;

  @prop({ required: true })
  color200!: string;

  @prop({ required: true })
  color300!: string;

  @prop({ required: true })
  color400!: string;

  @prop({ required: true })
  color500!: string;

  @prop({ required: true })
  color600!: string;

  @prop({ required: true })
  color700!: string;

  @prop({ required: true })
  color800!: string;

  @prop({ required: true })
  color900!: string;
}

export class Colors {
  @prop({ required: true })
  primary: ColorShades = new ColorShades();

  @prop({ required: true })
  success: ColorShades = new ColorShades();

  @prop({ required: true })
  info: ColorShades = new ColorShades();

  @prop({ required: true })
  warning: ColorShades = new ColorShades();

  @prop({ required: true })
  danger: ColorShades = new ColorShades();
}

export class Company extends Base<string> {
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

  @prop({ required: true })
  showCompanyName: boolean = true;

  @prop({ required: true })
  address: string = '';

  @prop({ required: true })
  cnpj: string = '';

  @prop({ required: true })
  qrcodeURL: string = '';

  @prop({ required: true })
  logoDefault: UploadedFile = new UploadedFile();

  @prop({ required: true })
  logoWithoutName: UploadedFile = new UploadedFile();

  @prop({ required: true })
  logoWhite: UploadedFile = new UploadedFile();

  @prop({ required: true })
  logoWhiteWithoutName: UploadedFile = new UploadedFile();

  @prop({ required: true })
  colors: Colors = new Colors();
}

export default getModelForClass(Company);
