import { getModelForClass, plugin, prop, Ref } from '@typegoose/typegoose';
import mongooseUniqueValidator from 'mongoose-unique-validator';

import { Base } from './base';
import { Company } from './company';

@plugin(mongooseUniqueValidator)
export class UserRef extends Base<string> {
  @prop({ required: true, unique: true })
  public email!: string;

  @prop({ required: true })
  public active: boolean = true;

  @prop({ required: true, ref: () => Company })
  public company: Ref<Company> = new Company();
}

export default getModelForClass(UserRef);
