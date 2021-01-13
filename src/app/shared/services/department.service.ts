import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import * as json_department_coordination from '../department-coordination.json';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  constructor(private userService: UserService) {}

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
    return coordinations.sort();
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

  userCoordinations(uId: string): string[] {
    if (uId == undefined) return [];
    const user = this.userService.idToUser(uId);
    const active: boolean[] = [
      user.adm,
      user.design,
      user.obras,
      user.impermeabilizacao,
      user.instalacoes,
      user.ambiental,
      user.arquitetura,
      user.hidrico,
      user.eletrica,
      user.civil,
      user.sanitaria,
    ];
    const allCoords = this.buildAllCoordinationsList();
    return allCoords.filter((cd: string, idx: number) => {
      return active[idx];
    });
  }
}
