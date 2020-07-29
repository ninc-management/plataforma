import { Injectable } from '@angular/core';
import * as json_department_coordination from '../department-coordination.json';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  buildDepartmentList(): string[] {
    let departments: string[] = [];
    for (const department of json_department_coordination.departments) {
      departments.push(this.composedName(department.abrev));
    }
    return departments;
  }

  buildCoordinationsList(departmentAbrev: string): string[] {
    let entry = json_department_coordination.departments.find(
      (el) => el.abrev === departmentAbrev
    );
    return entry.coordinations;
  }

  buildAllCoordinationsList(): string[] {
    let coordinations: string[] = [];
    for (const department of json_department_coordination.departments) {
      coordinations.push(...department.coordinations);
    }
    return coordinations;
  }

  composedName(abrev: string): string {
    let entry = json_department_coordination.departments.find(
      (el) => el.abrev === abrev
    );
    return entry.abrev + ' - ' + entry.name;
  }

  extractAbreviation(composedName: string): string {
    return composedName.substr(0, 3);
  }
}
