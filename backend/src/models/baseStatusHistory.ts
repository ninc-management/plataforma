import { prop } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';

export class StatusHistoryItem {
  @prop({ required: true })
  status!: string;

  @prop({ required: true })
  start: Date = new Date();

  @prop()
  end?: Date;
}

export class StatusHistory extends Base<string> {
  @prop({ required: true })
  status!: string;

  @prop({ type: () => [StatusHistoryItem] })
  statusHistory: StatusHistoryItem[] = [];
}
