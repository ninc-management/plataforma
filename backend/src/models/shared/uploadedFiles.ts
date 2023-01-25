import { prop } from '@typegoose/typegoose';

/**
 * Used by Contract and Team
 */
export class UploadedFile {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  url!: string;
}

export class UploadedFileWithDescription extends UploadedFile {
  @prop({ required: true })
  description!: string;
}
