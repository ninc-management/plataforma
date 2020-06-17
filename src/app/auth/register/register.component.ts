import { Component, OnInit } from '@angular/core';
import { NbRegisterComponent } from '@nebular/auth';

import * as json_state_city from '../../shared/state-city.json';
import * as user_validation from '../../shared/user-validation.json';

@Component({
  selector: 'ngx-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class NgxRegisterComponent extends NbRegisterComponent
  implements OnInit {
  cities: string[] = [];
  states: string[] = [];
  validation = (user_validation as any).default;

  ngOnInit() {
    this.buildStateList();
  }

  regexSanatizer(regex: string): string {
    return regex.replace(
      /[\\\^\$\.\|\?\*\+\(\)\[\{]/g,
      (el) => "\\" + el
    );
  }

  buildStateList() {
    let states: string[] = [];
    for (const state of json_state_city.estados) {
      states.push(state.sigla);
    }
    this.states = states;
  }

  buildCityList(state: string) {
    this.user.city = undefined;
    let entry = json_state_city.estados.find((el) => el.sigla === state);
    this.cities = entry.cidades;
  }
}
