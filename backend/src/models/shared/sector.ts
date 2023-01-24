import { prop } from '@typegoose/typegoose';

import { Base } from '../base';

export interface SectorLocals {
  isChecked: boolean;
}

/**
 * Used by User and Team
 */
export class Sector extends Base<string> {
  @prop({ required: true })
  name: string = '';

  @prop({ required: true })
  abrev: string = '';

  locals: SectorLocals = {
    isChecked: false,
  };
}
