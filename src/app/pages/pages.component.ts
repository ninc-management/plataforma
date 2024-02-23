import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, DoCheck, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NbAccessChecker } from '@nebular/security';
import { NbDialogService, NbIconLibraries, NbMenuItem, NbMenuService, NbSidebarService } from '@nebular/theme';
import { combineLatest, Subject } from 'rxjs';
import { skipWhile, take, takeUntil } from 'rxjs/operators';

import { LayoutService } from '../@core/utils';
import { OneColumnLayoutComponent } from '../@theme/layouts';
import { ReportMenuDialogComponent } from './dashboard/report-menu-dialog/report-menu-dialog.component';
import { MENU_ITEMS } from './pages-menu';
import { ContractorDialogComponent } from 'app/pages/contractors/contractor-dialog/contractor-dialog.component';
import {
  COMPONENT_TYPES,
  ContractDialogComponent,
} from 'app/pages/contracts/contract-dialog/contract-dialog.component';
import { InvoiceDialogComponent } from 'app/pages/invoices/invoice-dialog/invoice-dialog.component';
import { TEAM_COMPONENT_TYPES, TeamDialogComponent } from 'app/pages/teams/team-dialog/team-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { TransactionDialogComponent } from 'app/shared/components/transactions/transaction-dialog/transaction-dialog.component';
import { registerIcons } from 'app/shared/icon-utils';
import { AppUpdaterService } from 'app/shared/services/app-updater.service';
import { CompanyService } from 'app/shared/services/company.service';
import { ConfigService } from 'app/shared/services/config.service';
import { TeamService } from 'app/shared/services/team.service';
import { WebSocketService } from 'app/shared/services/web-socket.service';
import { Permissions } from 'app/shared/utils';

import { Company } from '@models/company';
import { EventsChecker } from '@models/platformConfig';
import { Team } from '@models/team';

enum DIALOG_TYPES {
  INVOICE,
  EXPENSE,
  CLIENT,
  TRANSFER,
  REPORT_MENU,
  TRANSACTION,
}

@Component({
  selector: 'ngx-pages',
  styleUrls: ['pages.component.scss'],
  templateUrl: './pages.component.html',
})
export class PagesComponent implements OnDestroy, DoCheck, AfterViewInit, OnInit {
  private destroy$ = new Subject<void>();
  @ViewChild(OneColumnLayoutComponent, { static: false })
  private layout!: OneColumnLayoutComponent;
  menu = MENU_ITEMS;
  dialogTypes = DIALOG_TYPES;
  social: NbMenuItem[] = [];
  nortanTeam!: Team;
  idleTimer?: number;
  company: Company = new Company();
  lastReceivedChange: any = {};

  constructor(
    private http: HttpClient,
    private router: Router,
    private iconsLibrary: NbIconLibraries,
    private layoutService: LayoutService,
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private accessChecker: NbAccessChecker,
    private configService: ConfigService,
    private dialogService: NbDialogService,
    private teamService: TeamService,
    private wsService: WebSocketService,
    private companyService: CompanyService,
    public Pwa: AppUpdaterService
  ) {}

  ngOnInit(): void {
    registerIcons(this.iconsLibrary);
    combineLatest([
      this.configService.isDataLoaded$,
      this.teamService.isDataLoaded$,
      this.companyService.isDataLoaded$,
      this.configService.getConfig(),
      this.teamService.getTeams(),
      this.companyService.getCompanies(),
      this.accessChecker.isGranted(Permissions.ELO_PRINCIPAL, 'view-users'),
    ])
      .pipe(
        takeUntil(this.destroy$),
        skipWhile(
          ([configsLoaded, teamsLoaded, companiesLoaded, , , ,]) => !(configsLoaded && teamsLoaded && companiesLoaded)
        )
      )
      .subscribe(([, , , configs, teams, , isGranted]) => {
        if (configs[0].company) {
          this.social = [];
          this.company = this.companyService.idToCompany(configs[0].company);
          this.wsService.emit('company', this.company._id);
          document.title = this.company.companyName;
          if (this.company.glassfrogLink) {
            this.social.push({
              title: 'GlassFrog',
              icon: {
                icon: 'glassfrog',
                pack: 'fac',
              },
              url: this.company.glassfrogLink,
              target: '_blank,',
              pathMatch: 'full',
              selected: false,
            });
          }
          if (this.company.gathertownLink) {
            this.social.push({
              title: 'Gather Town',
              icon: {
                icon: 'gtown',
                pack: 'fac',
              },
              url: this.company.gathertownLink,
              target: '_blank,',
              pathMatch: 'full',
              selected: false,
            });
          }
          if (this.company.youtubeLink) {
            this.social.push({
              title: 'YouTube',
              icon: {
                icon: 'social-youtube',
                pack: 'ion',
              },
              url: this.company.youtubeLink,
              target: '_blank,',
              pathMatch: 'full',
              selected: false,
            });
          }
          if (this.company.linkedinLink) {
            this.social.push({
              title: 'LinkedIn',
              icon: {
                icon: 'social-linkedin',
                pack: 'ion',
              },
              url: this.company.linkedinLink,
              target: '_blank,',
              pathMatch: 'full',
              selected: false,
            });
          }
          if (this.company.instagramLink) {
            this.social.push({
              title: 'Instagram',
              icon: {
                icon: 'social-instagram',
                pack: 'ion',
              },
              url: this.company.instagramLink,
              target: '_blank,',
              pathMatch: 'full',
              selected: false,
            });
          }
          this.wsService.manager.on('reconnect', () => {
            this.wsService.emit('company', this.company._id);
            this.http
              .post('/api/checkdb', { change: this.lastReceivedChange })
              .pipe(take(1))
              .subscribe((res: any) => {
                const response = JSON.parse(res) as EventsChecker<object>;
                if (!response['isUpdated']) {
                  // Last received event is too old
                  if (response['newEvents'].length == 0) {
                    this.dialogService
                      .open(ConfirmationDialogComponent, {
                        context: {
                          question:
                            'Novas alterações estão disponíveis na plataforma. Deseja atualizar a página para carregar as alterações?',
                        },
                        dialogClass: 'my-dialog',
                        closeOnBackdropClick: false,
                        closeOnEsc: false,
                        autoFocus: false,
                      })
                      .onClose.pipe(take(1))
                      .subscribe((response: boolean) => {
                        if (response) {
                          window.location.reload();
                        }
                      });
                  } else {
                    response['newEvents'].forEach((event: any) => {
                      this.wsService.manualEvents$.next(event);
                    });
                  }
                }
              });
            this.wsService.ioSocket.disconnect().connect();
          });
        }

        if (isGranted) {
          this.menu = this.menu.slice(0, 5);
          this.menu.push({
            title: 'Associados',
            icon: {
              icon: 'user',
              pack: 'fac',
            },
            link: '/pages/users',
            pathMatch: 'full',
          });
          this.menu.push({
            title: 'Times',
            icon: {
              icon: 'users',
              pack: 'fac',
            },
            link: '/pages/teams',
            pathMatch: 'full',
          });
          if (configs[0].modulesConfig.hasPromotion) {
            this.menu.push({
              title: 'Promoções',
              icon: {
                icon: 'trophy',
                pack: 'fac',
              },
              link: '/pages/promotions',
              pathMatch: 'full',
            });
          }
          if (configs[0].modulesConfig.hasCourse) {
            this.menu.push({
              title: 'Cursos',
              icon: {
                icon: 'courses',
                pack: 'fac',
              },
              link: '/pages/courses',
              pathMatch: 'full',
            });
          }
        }

        const nortanTeam = teams.find((team) => team.isOrganizationTeam);
        if (nortanTeam) this.nortanTeam = nortanTeam;
      });

    this.wsService
      .fromEvent('dbchange')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => (this.lastReceivedChange = data));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.menuService
      .onItemSelect()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: { tag: string; item: any }) => {
        if (this.layout.sidebarRef.nativeElement.classList.contains('expanded')) this.toggleSidebar();
      });
  }

  ngDoCheck(): void {
    for (const menu of this.menu.concat(this.social)) {
      if (menu['selected'] && menu['link'] !== this.router.url) {
        menu['selected'] = false;
      }
    }
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();

    return false;
  }

  installPwa(): void {
    if (this.Pwa.promptEvent) {
      this.Pwa.promptEvent.prompt();
    }
  }

  openDialog(dType: DIALOG_TYPES): void {
    switch (dType) {
      case DIALOG_TYPES.EXPENSE: {
        this.dialogService.open(ContractDialogComponent, {
          context: {
            title: 'ADICIONAR DESPESA',
            componentType: COMPONENT_TYPES.EXPENSE,
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        });
        break;
      }

      case DIALOG_TYPES.INVOICE: {
        this.dialogService.open(InvoiceDialogComponent, {
          context: {
            title: 'CADASTRO DE ORÇAMENTO',
            invoice: undefined,
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        });
        break;
      }

      case DIALOG_TYPES.CLIENT: {
        this.dialogService.open(ContractorDialogComponent, {
          context: {
            title: 'CADASTRO DE CLIENTE',
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        });
        break;
      }

      case DIALOG_TYPES.TRANSFER: {
        this.dialogService.open(TeamDialogComponent, {
          context: {
            title: 'TRANSFERÊNCIA',
            iTeam: this.nortanTeam,
            componentType: TEAM_COMPONENT_TYPES.TRANSFER,
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        });
        break;
      }

      case DIALOG_TYPES.REPORT_MENU: {
        this.dialogService.open(ReportMenuDialogComponent, {
          context: {},
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        });
        break;
      }

      case DIALOG_TYPES.TRANSACTION: {
        this.dialogService.open(TransactionDialogComponent, {
          context: {
            title: 'ADICIONAR TRANSAÇÃO',
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        });
        break;
      }

      default:
        break;
    }
  }
}
