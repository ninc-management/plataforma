import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { LocalDataSource } from 'ng2-smart-table';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { TeamDialogComponent } from './team-dialog/team-dialog.component';
import { Team } from '@models/team';

@Component({
  selector: 'ngx-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
})
export class TeamsComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  teams: Team[] = [];
  searchQuery = '';
  get filtredTeams(): Team[] {
    if (this.searchQuery !== '')
      return this.teams.filter((team) => {
        return (
          team.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          this.userService
            .idToName(team.leader)
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          team.expertise.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.teams.sort((a, b) => {
      return a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '') <
        b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        ? -1
        : 1;
    });
  }

  source: LocalDataSource = new LocalDataSource();

  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum time para o filtro selecionado.',
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    actions: {
      columnTitle: 'Ações',
      add: true,
      edit: true,
      delete: false,
    },
    columns: {
      name: {
        title: 'Nome do time',
        type: 'string',
      },
      expertise: {
        title: 'Área de atuação',
        type: 'string',
      },
      leaderName: {
        title: 'Líder',
        type: 'string',
      },
    },
  };

  constructor(
    private dialogService: NbDialogService,
    private userService: UserService,
    private teamService: TeamService,
    public utils: UtilsService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.teamService
      .getTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe((teams) => {
        this.teams = teams.map((team) => {
          team.leaderName = this.userService.idToName(team.leader);
          return team;
        });
        this.source.load(this.teams);
      });
  }

  openDialog(event: { data?: Team }): void {
    this.dialogService.open(TeamDialogComponent, {
      context: {
        title: event.data ? 'EDIÇÃO DE TIME' : 'CADASTRO DE TIME',
        team: event.data ? event.data : new Team(),
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
