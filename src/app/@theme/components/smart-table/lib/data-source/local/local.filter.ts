import { cloneDeep } from 'lodash';

import { accessNestedProperties } from 'app/shared/utils';

type GenericFunction = (...arg: any) => any;
export function filterValues(value: string, search: string) {
  return value.toString().toLowerCase().includes(search.toString().toLowerCase());
}

export class LocalFilter {
  static filter(data: Array<any>, field: string, search: string, customFilter?: GenericFunction): Array<any> {
    const filter: GenericFunction = customFilter ? customFilter : filterValues;
    const propertiesToAccess = field.split('.');

    if (propertiesToAccess.length > 1) {
      return data.filter((element) => {
        const value = accessNestedProperties(element, cloneDeep(propertiesToAccess), '');
        return filter.call(null, value, search);
      });
    }

    return data.filter((el) => {
      const value = typeof el[field] === 'undefined' || el[field] === null ? '' : el[field];
      return filter.call(null, value, search);
    });
  }
}
