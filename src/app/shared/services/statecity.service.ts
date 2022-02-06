import { Injectable } from '@angular/core';
import json_state_city from '../state-city.json';

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
    const entry = json_state_city.estados.find((el: any) => el.sigla === state);
    if (entry) return entry.cidades;
    return [];
  }
}
