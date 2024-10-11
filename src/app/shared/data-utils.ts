import json_state_city from './state-city.json';
import modules_resources from 'app/shared/modules-resources.json';

export type Permission = keyof typeof modules_resources;

type ResourcesList<Module extends Permission> = keyof (typeof modules_resources)[Module];

export type Resource = {
  [K in Permission]: ResourcesList<K>;
}[Permission];

export const PERMISSIONS = getPermissions();

export const RESOURCES = getResources();

function getPermissions(): { [K in Permission]: Permission } {
  const permissions: any = {};
  Object.keys(modules_resources).forEach((module: unknown) => {
    permissions[module as Permission] = module as Permission;
  });
  return permissions as { [K in Permission]: Permission };
}

function getResources(): { [K in Resource]: string } {
  const resources: any = {};
  for (const resourceObj of Object.values(modules_resources)) {
    for (const [resource, label] of Object.entries(resourceObj)) {
      resources[resource as Resource] = label;
    }
  }
  return resources as { [K in Resource]: string };
}

function isPermission(permission: string): permission is keyof typeof modules_resources {
  return permission in modules_resources;
}

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
