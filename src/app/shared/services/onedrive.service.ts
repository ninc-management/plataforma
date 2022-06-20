import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';
import { Invoice } from '@models/invoice';
import { Contract } from '@models/contract';
import { Observable, Subject, of, combineLatest, take, map, skipWhile, takeUntil } from 'rxjs';
import { TeamService } from './team.service';
import { UploadedFile } from 'app/@theme/components/file-uploader/file-uploader.service';
import { isOfType } from '../utils';
import { ConfigService } from './config.service';
import { PlatformConfig } from '@models/platformConfig';

@Injectable({
  providedIn: 'root',
})
export class OneDriveService implements OnDestroy {
  private destroy$ = new Subject<void>();
  config: PlatformConfig = new PlatformConfig();
  constructor(
    private http: HttpClient,
    private userService: UserService,
    private teamService: TeamService,
    private configService: ConfigService
  ) {
    combineLatest([
      teamService.getTeams(),
      this.configService.getConfig(),
      this.teamService.isDataLoaded$,
      this.configService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(([_, , isTeamDataLoaded, isConfigDataLoaded]) => !isTeamDataLoaded || !isConfigDataLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([_, config, ,]) => {
        this.config = config[0];
      });
  }

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

  oneDriveURI(): string {
    if (this.config.oneDriveConfig.oneDriveId && this.config.oneDriveConfig.folderId) {
      const URI =
        environment.onedriveUri +
        this.config.oneDriveConfig.oneDriveId.toLowerCase() +
        '/items/' +
        this.config.oneDriveConfig.oneDriveId.toUpperCase() +
        '!' +
        this.config.oneDriveConfig.folderId +
        ':/';

      return URI;
    }

    return '';
  }

  copyModelFolder(invoice: Invoice): Observable<boolean> {
    const modelFolder = 'ORC-000_ANO-NOME DO CONTRATO-GESTOR';
    const path = this.generateBasePath(invoice) + modelFolder;
    const isComplete$ = new Subject<boolean>();
    if (this.config.oneDriveConfig.isActive) {
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
          if (this.config.oneDriveConfig.oneDriveId) {
            const copyURI = environment.onedriveUri + this.config.oneDriveConfig.oneDriveId.toLowerCase() + '/items/';

            this.http
              .post(copyURI + metadata.id + '/copy', body)
              .pipe(take(1))
              .subscribe(() => isComplete$.next(true));
          }
        });
    }
    return isComplete$;
  }

  moveToConcluded(invoice: Invoice): void {
    const originalPath = this.generatePath(invoice);
    if (this.config.oneDriveConfig.isActive) {
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
  }

  webUrl(contract: Contract): Observable<string> {
    if (this.config.oneDriveConfig.isActive) {
      if (
        isOfType<Invoice>(contract.invoice, ['_id', 'author', 'nortanTeam', 'sector', 'code', 'type', 'contractor'])
      ) {
        const invoice = contract.invoice;
        const concluded = invoice.status === 'Concluído';
        return this.http.get(this.oneDriveURI() + this.generatePath(invoice, concluded)).pipe(
          take(1),
          map((metadata: any): string => metadata.webUrl)
        );
      }
    }
    return of('').pipe(take(1));
  }

  deleteFiles(path: string, filesToRemove: UploadedFile[]): void {
    if (this.config.oneDriveConfig.isActive) {
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createLinkURI(id: string): string {
    if (this.config.oneDriveConfig.oneDriveId && this.config.oneDriveConfig.folderId) {
      return (
        environment.onedriveUri + this.config.oneDriveConfig.oneDriveId.toLowerCase() + '/items/' + id + '/createLink'
      );
    }

    return '';
  }
}
