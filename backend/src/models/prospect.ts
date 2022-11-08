import { getModelForClass, plugin } from '@typegoose/typegoose';
import mongooseUniqueValidator from 'mongoose-unique-validator';

import { User } from './user';

@plugin(mongooseUniqueValidator)
export class Prospect extends User {}
