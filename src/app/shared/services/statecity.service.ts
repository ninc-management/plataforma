import { Injectable } from '@angular/core';
import * as json_state_city from '../state-city.json';

@Injectable({
  providedIn: 'root',
})
export class StatecityService {
  buildStateList(): string[] {
    let states: string[] = [];
    for (const state of json_state_city.estados) {
      states.push(state.sigla);
    }
    return states;
  }

  buildCityList(state: string): string[] {
    let entry = json_state_city.estados.find((el) => el.sigla === state);
    return entry.cidades;
  }
}
