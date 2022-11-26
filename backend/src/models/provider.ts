import { getModelForClass, plugin, prop } from '@typegoose/typegoose';
import mongooseUniqueValidator from 'mongoose-unique-validator';

import { Base } from './base';
import { UploadedFileWithDescription } from './shared/uploadedFiles';

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

@plugin(mongooseUniqueValidator)
export class Provider extends Base<string> {
  @prop({ required: true })
  name: string = '';

  @prop({ required: true, unique: true })
  document: string = '';

  @prop({ required: true })
  description: string = '';

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

  @prop()
  bankName: string = '';

  @prop()
  agency: string = '';

  @prop()
  accountNumber: string = '';

  @prop()
  pix: string = '';

  @prop()
  operation: string = '';

  @prop({ type: () => [Contact] })
  contacts: Contact[] = [];
}

