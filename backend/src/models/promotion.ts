import { prop, getModelForClass } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';

export class PromotionRule {
  @prop({ required: true })
  container!: string;

  @prop({ required: true })
  operator!: string;

  @prop({ required: true })
  value!: string;
}

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
