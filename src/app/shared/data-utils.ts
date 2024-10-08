import json_state_city from './state-city.json';

export function buildStateList(): string[] {
  const states: string[] = [];
  for (const state of json_state_city.estados) {
    states.push(state.sigla);
  }
  return states;
}

export function buildCityList(state: string): string[] {
  const entry = json_state_city.estados.find((el: any) => el.sigla === state);
  if (entry) return entry.cidades;
  return [];
}
