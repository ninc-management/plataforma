import { Injectable } from '@angular/core';
import * as json_department_coordination from '../department-coordination.json';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  buildDepartmentList(): string[] {
    let departments: string[] = [];
    for (const department of json_department_coordination.departments) {
      departments.push(department.abrev);
    }
    return departments;
  }

  buildCoordinationsList(department: string): string[] {
    let entry = json_department_coordination.departments.find(
      (el) => el.abrev === department
    );
    return entry.coordinations;
  }
}
