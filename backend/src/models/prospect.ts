import { getModelForClass, plugin } from '@typegoose/typegoose';
import { User } from './user';
import * as uniqueValidator from 'mongoose-unique-validator';

@plugin(uniqueValidator)
export class Prospect extends User {}

export default getModelForClass(Prospect);
