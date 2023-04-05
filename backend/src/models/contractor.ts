import { getModelForClass, plugin, prop } from '@typegoose/typegoose';
import mongooseUniqueValidator from 'mongoose-unique-validator';

import { Base } from './base';

export class Address {
  @prop({ required: true })
  zipCode: string = '';

  @prop({ required: true })
  streetAddress: string = '';

  @prop({ required: true })
  houseNumber: string = '';

  @prop({ required: true })
  district: string = '';

  @prop()
  complement?: string = '';

  @prop({ required: true })
  city: string = '';

  @prop({ required: true })
  state: string = '';

  toString(): string {
    return `${this.streetAddress}, ${this.complement ? this.complement + ', ' : ''} ${this.houseNumber}, ${
      this.district
    }, ${this.city}/${this.state}, ${this.zipCode}`;
  }
}

export class ComercialRepresentative {
  @prop({ required: true })
  fullName: string = '';

  @prop({ required: true })
  email: string = '';

  @prop({ required: true })
  phone: string = '';

  @prop({ required: true })
  occupation: string = '';

  locals = {
    isNew: true,
  };
}

export class LegalRepresentative extends ComercialRepresentative {
  @prop({ required: true })
  cpf: string = '';

  @prop({ required: true })
  nationality: string = '';

  @prop({ required: true })
  maritalStatus: string = '';

  @prop({ type: () => Address })
  address: Address = new Address();
}

@plugin(mongooseUniqueValidator)
export class Contractor extends Base<string> {
  @prop({ required: true })
  fullName: string = '';

  @prop({ required: true, unique: true })
  document: string = '';

  @prop()
  corporateName?: string;

  @prop({ required: true })
  email: string = '';

  @prop({ type: () => Address })
  address: Address = new Address();

  @prop({ required: true })
  phone: string = '';

  @prop({ required: true, type: () => [LegalRepresentative] })
  legalRepresentatives: LegalRepresentative[] = [];

  @prop({ required: true, type: () => [ComercialRepresentative] })
  comercialRepresentatives: ComercialRepresentative[] = [];
}

export default getModelForClass(Contractor);
