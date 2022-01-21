import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { UtilsService } from './utils.service';
import { environment } from '../../../environments/environment';
import { Invoice } from '@models/invoice';
import { Contract } from '@models/contract';
import { take, map } from 'rxjs/operators';
import { Observable, Subject, of } from 'rxjs';
import { TeamExpense } from '@models/team';
import { TeamService } from './team.service';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';

@Injectable({
  providedIn: 'root',
})
export class OnedriveService {
  constructor(
    private http: HttpClient,
    private userService: UserService,
    private utils: UtilsService,
    private teamService: TeamService
  ) {}

  private generateBasePath(invoice: Invoice, concluded = false): string {
    let path = '';
    if (invoice.nortanTeam) path = this.teamService.idToTeam(invoice.nortanTeam).config.path;
    path += concluded ? '/02-Concluídos/' : '/01-Em Andamento/';
    return path;
  }

  private generateFolderName(invoice: Invoice): string {
    const slices = invoice.code.replace(/\//g, '_').split('-');
    const numberSlices = slices[1].split('_');
    const authorName = invoice.author ? this.userService.idToShortName(invoice.author) : '';

    return (
      slices[0] +
      '-' +
      numberSlices[0].padStart(3, '0') +
      '_' +
      numberSlices[1] +
      '-' +
      invoice['name']?.replace(/\//g, '-') +
      '-' +
      authorName
    );
  }

  generatePath(invoice: Invoice, concluded = false): string {
    return this.generateBasePath(invoice, concluded) + this.generateFolderName(invoice);
  }

  generateNortanExpensesPath(nortanExpense: TeamExpense): string {
    let path = '10-Financeiro/Comprovantes/' + nortanExpense.type;
    if (nortanExpense.subType) {
      path += '/' + nortanExpense.subType;
    }
    return path;
  }

  oneDriveURI(isAdm?: boolean): string {
    let URI = '';
    if (environment.onedriveUri) {
      if (environment.onedriveUri.match(/root/g)?.length) URI = environment.onedriveUri;
      else {
        URI =
          environment.onedriveUri +
          (isAdm !== undefined ? environment.onedriveAdmID : environment.onedriveNortanID) +
          ':/';
      }
    }
    return URI;
  }

  copyModelFolder(invoice: Invoice): Observable<boolean> {
    const modelFolder = 'ORC-000_ANO-NOME DO CONTRATO-GESTOR';
    const path = this.generateBasePath(invoice) + modelFolder;
    const isComplete$ = new Subject<boolean>();

    this.http
      .get(this.oneDriveURI() + path)
      .pipe(take(1))
      .subscribe((metadata: any) => {
        const body = {
          parentReference: {
            driveId: metadata.parentReference.driveId,
            id: metadata.parentReference.id,
          },
          name: this.generateFolderName(invoice),
        };
        if (environment.onedriveUri) {
          let copyURI: string;
          if (environment.onedriveUri.match(/root/g)?.length) copyURI = environment.onedriveUri.slice(0, -6) + 'items/';
          else copyURI = environment.onedriveUri;
          this.http
            .post(copyURI + metadata.id + '/copy', body)
            .pipe(take(1))
            .subscribe(() => isComplete$.next(true));
        }
      });
    return isComplete$;
  }

  moveToConcluded(invoice: Invoice): void {
    const originalPath = this.generatePath(invoice);

    this.http
      .get(this.oneDriveURI() + this.generateBasePath(invoice, true))
      .pipe(take(1))
      .subscribe((metadata: any) => {
        const body = {
          parentReference: {
            id: metadata.id,
          },
          name: this.generateFolderName(invoice),
        };
        this.http
          .patch(this.oneDriveURI() + originalPath, body)
          .pipe(take(1))
          .subscribe();
      });
  }

  webUrl(contract: Contract): Observable<string> {
    if (
      this.utils.isOfType<Invoice>(contract.invoice, [
        '_id',
        'author',
        'nortanTeam',
        'sector',
        'code',
        'type',
        'contractor',
      ])
    ) {
      const invoice = contract.invoice;
      const concluded = invoice.status === 'Concluído';
      return this.http.get(this.oneDriveURI() + this.generatePath(invoice, concluded)).pipe(
        take(1),
        map((metadata: any): string => metadata.webUrl)
      );
    }
    return of('');
  }

  deleteFiles(path: string, filesToRemove: UploadedFile[]): void {
    this.http
      .get(this.oneDriveURI() + path + ':/children')
      .pipe(take(1))
      .subscribe((metadata: any) => {
        if (metadata.value) {
          metadata.value.forEach((data: any) => {
            filesToRemove.forEach((file) => {
              if (file.name === data.name) {
                this.http
                  .delete(environment.onedriveUri.slice(0, -6) + 'items/' + data.id)
                  .pipe(take(1))
                  .subscribe(() => console.log('Arquivo apagado!'));
                const index = filesToRemove.indexOf(file, 0);
                if (index > -1) filesToRemove.splice(index, 1);
              }
            });
          });
        }
      });
  }
}
