import { Schema } from 'mongoose';

declare function mongooseUniqueValidator(schema: Schema, options?: any): void;

declare namespace mongooseUniqueValidator {}