import { getModelForClass, plugin } from '@typegoose/typegoose';
import mongooseUniqueValidator from 'mongoose-unique-validator';

import { UserRef } from './userRef';

@plugin(mongooseUniqueValidator)
export class ProspectRef extends UserRef {}

export default getModelForClass(ProspectRef);
