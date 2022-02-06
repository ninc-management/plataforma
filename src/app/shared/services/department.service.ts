import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { User } from '@models/user';
import json_department_coordination from '../department-coordination.json';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  constructor(private userService: UserService) {}

  buildDepartmentList(): string[] {
    const departments: string[] = [];
    for (const department of json_department_coordination.departments) {
      departments.push(this.composedName(department.abrev));
    }
    return departments;
  }

  buildCoordinationsList(departmentAbrev: string): string[] {
    const entry = json_department_coordination.departments.find((el) => el.abrev === departmentAbrev);
    if (entry) return entry.coordinations;
    return [];
  }

  buildAllCoordinationsList(): string[] {
    const coordinations: string[] = [];
    for (const department of json_department_coordination.departments) {
      coordinations.push(...department.coordinations);
    }
    return coordinations.sort();
  }

  composedName(abrev: string): string {
    const entry = json_department_coordination.departments.find((el: any) => el.abrev === abrev);
    if (entry) return entry.abrev + ' - ' + entry.name;
    return '';
  }

  extractAbreviation(composedName: string): string {
    return composedName.substr(0, 3);
  }

  userCoordinations(uId: string | User | undefined): string[] {
    if (uId == undefined) return [];
    let user: User;
    if (typeof uId == 'string') user = this.userService.idToUser(uId);
    else {
      if (uId._id) user = this.userService.idToUser(uId._id);
      else return [];
    }
    const active: boolean[] = [
      // user.adm ? true : false,
      // user.design ? true : false,
      // user.obras ? true : false,
      // user.impermeabilizacao ? true : false,
      // user.instalacoes ? true : false,
      // user.ambiental ? true : false,
      // user.arquitetura ? true : false,
      // user.hidrico ? true : false,
      // user.eletrica ? true : false,
      // user.civil ? true : false,
      // user.sanitaria ? true : false,
      // user.incendio ? true : false,
    ];
    const allCoords = this.buildAllCoordinationsList();
    //  A ordem das coordenações no active array precisa ser igual a ordem allCoords.
    return allCoords.filter((cd: string, idx: number) => {
      return active[idx];
    });
  }

  userDepartments(uId: string): string[] {
    if (uId == undefined) return [];
    const uCoords = this.userCoordinations(uId);
    const allCoords = this.buildAllCoordinationsList();
    const departmentsAbrevs = this.buildDepartmentList().map((d) => d.slice(0, 3)); // DAD DEC DAQ DPC DRM
    const uDepartments: string[] = [];

    for (const coord of uCoords) {
      switch (coord) {
        case allCoords[0]:
          uDepartments.push(departmentsAbrevs[0]);
          break;
        case allCoords[1]:
          uDepartments.push(departmentsAbrevs[2]);
          break;
        case allCoords[2]:
          uDepartments.push(departmentsAbrevs[1]);
          break;
        case allCoords[3]:
          uDepartments.push(departmentsAbrevs[1]);
          break;
        case allCoords[4]:
          uDepartments.push(departmentsAbrevs[1]);
          break;
        case allCoords[5]:
          uDepartments.push(departmentsAbrevs[4]);
          break;
        case allCoords[6]:
          uDepartments.push(departmentsAbrevs[2]);
          break;
        case allCoords[7]:
          uDepartments.push(departmentsAbrevs[4]);
          break;
        case allCoords[8]:
          uDepartments.push(departmentsAbrevs[3]);
          break;
        case allCoords[9]:
          uDepartments.push(departmentsAbrevs[3]);
          break;
        case allCoords[10]:
          uDepartments.push(departmentsAbrevs[3]);
          break;
        default:
          break;
      }
    }
    return [...new Set(uDepartments)];
  }
}
