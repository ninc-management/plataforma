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

    if (propertiesToAccess.length > 1) {
      return data.sort((elementA, elementB) => {
        const valueA = accessNestedProperty(elementA, cloneDeep(propertiesToAccess));
        const valueB = accessNestedProperty(elementB, cloneDeep(propertiesToAccess));
        return compare.call(null, dir, valueA, valueB);
      });
    }

    return data.sort((a, b) => {
      return compare.call(null, dir, a[field], b[field]);
    });
  }
}
