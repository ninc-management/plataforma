import { prop, getModelForClass } from '@typegoose/typegoose';
import { Base } from './base';
import { ExpenseType } from './team';

export class platformConfig extends Base<string> {
  @prop({ required: true, type: () => [ExpenseType] })
  expenseTypes: ExpenseType[] = [];
}

export default getModelForClass(platformConfig);