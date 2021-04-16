import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';
import { take, map } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

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

  private generateBasePath(invoice: 'object', concluded = false): string {
    let path = this.departmentPath[invoice['department'].slice(0, 3)];
    path += concluded ? '/02-Concluídos/' : '/01-Em Andamento/';
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

  generatePath(invoice: 'object', concluded = false): string {
    return (
      this.generateBasePath(invoice, concluded) +
      this.generateForderName(invoice)
    );
  }

  copyModelFolder(invoice: 'object'): Observable<boolean> {
    const modelFolder = 'ORC-000_ANO-NOME DO CONTRATO-GESTOR';
    const path = this.generateBasePath(invoice) + modelFolder;
    let isComplete$ = new Subject<boolean>();

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
          .subscribe(() => isComplete$.next(true));
      });
    return isComplete$;
  }

  moveToConcluded(invoice: 'object'): void {
    const originalPath = this.generatePath(invoice);

    this.http
      .get(environment.onedriveUri + this.generateBasePath(invoice, true))
      .pipe(take(1))
      .subscribe((metadata) => {
        const body = {
          parentReference: {
            id: metadata['id'],
          },
          name: this.generateForderName(invoice),
        };
        this.http
          .patch(environment.onedriveUri + originalPath, body)
          .pipe(take(1))
          .subscribe();
      });
  }

  webUrl(contract: 'object'): Observable<string> {
    const concluded = contract['invoice'].status === 'Concluído';
    return this.http
      .get(
        environment.onedriveUri +
          this.generatePath(contract['invoice'], concluded)
      )
      .pipe(
        take(1),
        map((metadata) => metadata['webUrl'])
      );
  }
}
