import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';
import { take } from 'rxjs/operators';

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

  constructor(private http: HttpClient, private userService: UserService) {}

  private generateBasePath(invoice: 'object'): string {
    let path = this.departmentPath[invoice['department'].slice(0, 3)];
    path += '/01-Em Andamento/'; //TODO: Criar um outro argumento para definir se o contrato foi concluido e mover para '02-Concluídos'
    return path;
  }

  private generateForderName(invoice: 'object'): string {
    const slices = invoice['code'].replace('/', '_').split('-');
    const numberSlices = slices[1].split('_');
    const author = this.userService.idToUser(invoice['author']);
    const authorName = author?.exibitionName
      ? author.exibitionName
      : author.fullName;

    return (
      slices[0] +
      '-' +
      numberSlices[0].padStart(3, '0') +
      '_' +
      numberSlices[1] +
      '-' +
      invoice['name'] +
      '-' +
      authorName
    );
  }

  generatePath(invoice: 'object'): string {
    return this.generateBasePath(invoice) + this.generateForderName(invoice);
  }

  copyModelFolder(invoice: 'object'): void {
    const modelFolder = 'ORC-000_ANO-NOME DO CONTRATO-GESTOR';
    const path = this.generateBasePath(invoice) + modelFolder;

    this.http
      .get(environment.onedriveUri + path)
      .pipe(take(1))
      .subscribe((metadata) => {
        const body = {
          parentReference: {
            driveId: metadata['parentReference'].driveId,
            id: metadata['parentReference'].id,
          },
          name: this.generateForderName(invoice),
        };
        this.http
          .post(environment.onedriveUri + path + ':/copy', body)
          .pipe(take(1))
          .subscribe();
      });
  }
}
