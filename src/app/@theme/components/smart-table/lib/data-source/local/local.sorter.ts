import { cloneDeep } from 'lodash';

import { accessNestedProperty } from 'app/shared/utils';

type GenericFunction = (...arg: any) => any;

export function compareValues(direction: any, a: any, b: any) {
  if (a < b) {
    return -1 * direction;
  }
  if (a > b) {
    return direction;
  }
  return 0;
}
export class LocalSorter {
  static sort(data: Array<any>, field: string, direction: string, customCompare?: GenericFunction): Array<any> {
    const dir: number = direction === 'asc' ? 1 : -1;
    const compare: GenericFunction = customCompare ? customCompare : compareValues;
    const propertiesToAccess = field.split('.');

    let valueA = undefined;
    let valueB = undefined;
    return data.sort((elementA, elementB) => {
      if (propertiesToAccess.length > 1) {
        valueA = accessNestedProperty(elementA, cloneDeep(propertiesToAccess));
        valueB = accessNestedProperty(elementB, cloneDeep(propertiesToAccess));
      } else {
        valueA = elementA[field];
        valueB = elementB[field];
      }
      return compare.call(null, dir, valueA, valueB);
    });
  }
}
