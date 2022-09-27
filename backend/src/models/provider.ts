import { getModelForClass, plugin, prop } from '@typegoose/typegoose';
import mongooseUniqueValidator from 'mongoose-unique-validator';

import { Base } from './base';
import { UploadedFileWithDescription } from './shared';

export class Contact {
  @prop({ required: true })
  name: string = '';

  @prop({ required: true })
  email: string = '';

  @prop({ required: true })
  position: string = '';

  @prop({ required: true })
  number: string = '';
}

export class BankAccount {
  @prop({ required: true })
  name: string = '';

  @prop({ required: true })
  agency: string = '';

  @prop({ required: true })
  accountNumber: string = '';

  @prop({ required: true })
  pix: string = '';

  @prop()
  operation: string = '';
}

@plugin(mongooseUniqueValidator)
export class Provider extends Base<string> {
  @prop({ required: true })
  fullName: string = '';

  @prop({ required: true, unique: true })
  document: string = '';

  @prop({ required: true })
  email: string = '';

  @prop({ required: true })
  address: string = '';

  @prop({ required: true })
  phone: string = '';

  @prop()
  profilePicture?: string;

  @prop({ type: () => [String] })
  serviceList: string[] = [];

  @prop({ type: () => [String] })
  productList: string[] = [];

  @prop({ type: () => [UploadedFileWithDescription] })
  uploadedFiles: UploadedFileWithDescription[] = [];

  @prop()
  observation: string = '';

  @prop({ type: () => BankAccount })
  bankData: BankAccount = new BankAccount();

  @prop({ type: () => [Contact] })
  contact: Contact[] = [];
}

export default getModelForClass(Provider);
