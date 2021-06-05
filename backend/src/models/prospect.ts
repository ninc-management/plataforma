import { getModelForClass, plugin } from '@typegoose/typegoose';
import { User } from './user';
import mongooseUniqueValidator from 'mongoose-unique-validator';

@plugin(mongooseUniqueValidator)
export class Prospect extends User {}

export default getModelForClass(Prospect);
