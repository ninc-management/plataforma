import { Pipe, PipeTransform } from '@angular/core';

type GetElementType<T extends any[]> = T extends (infer U)[] ? U : never;

@Pipe({
  name: 'transformPipe',
})
export class TransformPipe implements PipeTransform {
  transform<F extends (...args: any[]) => ReturnType<F>>(
    fnArguments: Parameters<F>,
    fnReference: F,
    property?: keyof NonNullable<Exclude<GetElementType<Parameters<F>>, string>>
  ): string {
    return property ? (fnReference(...fnArguments) as any)[property] : fnReference(...fnArguments);
  }
}
