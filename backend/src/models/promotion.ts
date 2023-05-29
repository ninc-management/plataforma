import { DocumentType, getModelForClass, pre, prop } from '@typegoose/typegoose';
import { UpdateQuery } from 'mongoose';

import { Base } from './base';

export class PromotionRule {
  @prop({ required: true })
  container!: string;

  @prop({ required: true })
  operator!: string;

  @prop({ required: true })
  value!: string;
}

@pre<Promotion>('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as UpdateQuery<DocumentType<Promotion>>;
  if (update.__v) delete update.__v;
  if (update['$set'] && update['$set'].__v) {
    delete update['$set'].__v;
    if (Object.keys(update['$set']).length === 0) {
      delete update['$set'];
    }
  }
  update['$inc'] = update['$inc'] || {};
  update['$inc'].__v = 1;
  next();
})
export class Promotion extends Base<string> {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  cashback!: string;

  @prop({ required: true })
  status!: string;

  @prop({ required: true })
  start!: Date;

  @prop({ required: true })
  end!: Date;

  @prop({ required: true })
  created: Date = new Date();

  @prop({ required: true })
  lastUpdate: Date = new Date();

  @prop({ type: () => [PromotionRule] })
  rules: PromotionRule[] = [];
}

export default getModelForClass(Promotion);
