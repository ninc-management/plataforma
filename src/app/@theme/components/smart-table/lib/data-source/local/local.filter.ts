import { cloneDeep } from 'lodash';

import { accessNestedProperty } from 'app/shared/utils';

type GenericFunction = (...arg: any) => any;
export function filterValues(value: string, search: string) {
  return value.toString().toLowerCase().includes(search.toString().toLowerCase());
}

export class LocalFilter {
  static filter(data: Array<any>, field: string, search: string, customFilter?: GenericFunction): Array<any> {
    const filter: GenericFunction = customFilter ? customFilter : filterValues;
    const propertiesToAccess = field.split('.');

    let value = undefined;
    return data.filter((element) => {
      if (propertiesToAccess.length > 1) {
        value = accessNestedProperty(element, cloneDeep(propertiesToAccess));
      } else {
        value = typeof element[field] === 'undefined' || element[field] === null ? '' : element[field];
      }
      return filter.call(null, value, search);
    });
  }
}
