import { prop, getModelForClass, Ref, plugin } from '@typegoose/typegoose';
import { Base } from '@typegoose/typegoose/lib/defaultClasses';
import mongooseUniqueValidator from 'mongoose-unique-validator';

export class UserExpertise {
  @prop({ required: true })
  public coordination!: string;

  @prop({ required: true })
  public text!: string;

  @prop({ required: true })
  public shortExpertise!: string;
}

@plugin(mongooseUniqueValidator)
export class User extends Base<string> {
  @prop({ required: true })
  public fullName: string = '';

  @prop()
  public exibitionName?: string;

  @prop({ required: true, unique: true })
  public email!: string;

  @prop({ required: true })
  public emailNortan!: string;

  @prop({ required: true })
  public phone!: string;

  @prop({ required: true })
  public article!: string;

  @prop({ required: true })
  public state!: string;

  @prop({ required: true })
  public city!: string;

  @prop()
  public education?: string;

  @prop()
  public arquitetura?: boolean;

  @prop()
  public instalacoes?: boolean;

  @prop()
  public design?: boolean;

  @prop()
  public civil?: boolean;

  @prop()
  public baixaTensao?: boolean;

  @prop()
  public mediaTensao?: boolean;

  @prop()
  public sanitaria?: boolean;

  @prop()
  public obras?: boolean;

  @prop()
  public impermeabilizacao?: boolean;

  @prop()
  public ambiental?: boolean;

  @prop()
  public hidrico?: boolean;

  @prop()
  public adm?: boolean;

  @prop()
  public more?: boolean;

  @prop()
  public meet?: string;

  @prop()
  public profilePicture?: string;

  @prop({ required: true })
  public mainDepartment!: string;

  @prop({ type: () => [String] })
  public position: string[] = [];

  @prop({ required: true })
  public level!: string;

  @prop({ unique: true })
  public document!: string;

  @prop({ type: () => [UserExpertise] })
  public expertise: UserExpertise[] = [];

  @prop({ ref: () => User })
  public AER: Ref<User>[] = [];

  @prop()
  public theme?: string;
}

export default getModelForClass(User);
