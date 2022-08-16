import { getModelForClass, plugin, prop } from '@typegoose/typegoose';
import mongooseUniqueValidator from 'mongoose-unique-validator';

import { Base } from './base';

export class Address {
  @prop({ required: true })
  zipCode: string = '';

  @prop({ required: true })
  streetAddress: string = '';

  @prop({ required: true })
  number: string = '';

  @prop({ required: true })
  district: string = '';

  @prop()
  complement: string = '';

  @prop({ required: true })
  city: string = '';

  @prop({ required: true })
  state: string = '';
}

@plugin(mongooseUniqueValidator)
export class Contractor extends Base<string> {
  @prop({ required: true })
  fullName: string = '';

  @prop({ required: true, unique: true })
  document: string = '';

  @prop({ required: true })
  corporateName: string = '';

  @prop({ required: true })
  email: string = '';

  @prop({ type: () => Address })
  address: Address = new Address();

  @prop({ required: true })
  phone: string = '';
}

export default getModelForClass(Contractor);
