import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class OnedriveService {
  private readonly departmentPath = {
    DAD: '01-DAD',
    DAQ: '02-DAQ',
    DEC: '03-DEC',
    DPC: '04-DPC',
    DRM: '05-DRM',
  };

  constructor() {}

  generatePath(invoice: 'object'): string {
    let path = this.departmentPath[invoice['department'].slice(0, 3)];
    path += '/01-Em Andamento/'; //TODO: Criar um outro argumento para definir se o contrato foi concluido e mover para '02-Concluídos'

    const slices = invoice['code'].replace('/', '_').split('-'); //ORC-14/2021-NRT/DEC-00
    const numberSlices = slices[1].split('_');
    const authorName = invoice['author']?.exibitionName
      ? invoice['author'].exibitionName
      : invoice['author'].fullName;
    const folderName =
      slices[0] +
      '-' +
      numberSlices[0].padStart(3, '0') +
      '_' +
      numberSlices[1] +
      '-' +
      invoice['name'] +
      '-' +
      authorName;

    path += folderName;

    return path;
  }
}
