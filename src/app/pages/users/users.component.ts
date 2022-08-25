import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService, NbTabComponent } from '@nebular/theme';
import { combineLatest, Subject } from 'rxjs';
import { skipWhile, take, takeUntil } from 'rxjs/operators';

import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfigService } from 'app/shared/services/config.service';
import { ProspectService } from 'app/shared/services/prospect.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import { isPhone, nameSort } from 'app/shared/utils';

import { PlatformConfig } from '@models/platformConfig';
import { Prospect } from '@models/prospect';
import { User } from '@models/user';

enum TAB_TITLES {
  ASSOCIADOS = 'Associados',
  PROSPECTOS = 'Prospectos',
}

@Component({
  selector: 'ngx-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  users: User[] = [];
  prospects: Prospect[] = [];
  searchQuery = '';
  isProspectTab = false;
  isTableDataLoaded = false;

  get filtredUsers(): User[] {
    if (this.searchQuery !== '')
      return this.users.filter((user) => {
        return (
          user.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          user.document.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          user.phone.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.users.sort((a, b) => {
      return nameSort(1, a.fullName, b.fullName);
    });
  }

  get filteredProspects(): Prospect[] {
    if (this.searchQuery !== '')
      return this.prospects.filter((prospect) => {
        return (
          prospect.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          prospect.phone.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          prospect.email.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.prospects.sort((a, b) => nameSort(1, a.fullName, b.fullName));
  }

  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum usuário para o filtro selecionado.',
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="fa fa-dollar-sign"></i>',
      confirmDelete: false,
    },
    actions: {
      columnTitle: 'Ações',
      add: false,
      edit: true,
      delete: false,
    },
    columns: {
      fullName: {
        title: 'Associado',
        type: 'string',
      },
      professionalEmail: {
        title: 'Email profissional',
        type: 'string',
      },
      phone: {
        title: 'Telefone',
        type: 'string',
      },
      email: {
        title: 'Conta Microsoft',
        type: 'string',
      },
      active: {
        title: 'Ativos?',
        type: 'string',
        valuePrepareFunction: (value: any) => (value ? '✅' : '❌'),
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [
              {
                value: true,
                title: '✅',
              },
              {
                value: false,
                title: '❌',
              },
            ],
          },
        },
      },
    },
  };

  prospectsSettings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum prospecto para o filtro selecionado.',
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="eva eva-checkmark-outline"></i>',
      confirmDelete: false,
    },
    actions: {
      columnTitle: 'Ações',
      add: false,
      edit: true,
      delete: true,
    },
    columns: {
      fullName: {
        title: 'Prospecto',
        type: 'string',
      },
      email: {
        title: 'Email',
        type: 'string',
      },
      phone: {
        title: 'Telefone',
        type: 'string',
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();
  prospectSource: LocalDataSource = new LocalDataSource();
  config: PlatformConfig = new PlatformConfig();

  isPhone = isPhone;

  constructor(
    private dialogService: NbDialogService,
    private userService: UserService,
    private prospectService: ProspectService,
    private configService: ConfigService,
    public teamService: TeamService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    combineLatest([
      this.userService.getUsers(),
      this.prospectService.getProspects(),
      this.configService.getConfig(),
      this.userService.isDataLoaded$,
      this.prospectService.isDataLoaded$,
      this.configService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(
          ([, , , isUserDataLoaded, isProspectDataLoaded, isConfigDataLoaded]) =>
            !(isUserDataLoaded && isProspectDataLoaded && isConfigDataLoaded)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(([users, prospects, configs, isUserDataLoaded, isProspectDataLoaded]) => {
        this.users = users;
        this.prospects = prospects;
        this.source.load(this.users);
        this.prospectSource.load(this.prospects);
        this.isTableDataLoaded = isUserDataLoaded && isProspectDataLoaded;
        this.config = configs[0];
      });
  }

  userDialog(event: { data?: User }): void {
    this.dialogService.open(UserDialogComponent, {
      context: {
        title: this.isProspectTab ? 'EDIÇÃO DE PROSPECTO' : 'EDIÇÃO DE ASSOCIADO',
        user: event.data ? event.data : new User(),
        isProspect: this.isProspectTab,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }

  setActiveTab(event: NbTabComponent) {
    this.isProspectTab = event.tabTitle.toLowerCase() == TAB_TITLES.PROSPECTOS.toLowerCase();
  }

  approveProspect(prospect: Prospect): void {
    this.dialogService
      .open(ConfirmationDialogComponent, {
        context: {
          question: 'Realmente deseja aprovar ' + prospect.fullName + '?',
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((response) => {
        if (response) this.prospectService.approveProspect(prospect);
      });
  }
}
