import { Component, OnInit } from '@angular/core';
import { UtilsService } from 'app/shared/services/utils.service';
import { LocalDataSource } from 'ng2-smart-table';

@Component({
  selector: 'teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
})
export class TeamsComponent implements OnInit {
  teams: any[] = [];
  searchQuery = '';
  get filtredTeams(): any[] {
    if (this.searchQuery !== '')
      return this.teams.filter((team) => {
        return (
          team.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          team.leader.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
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
      area: {
        title: 'Área de atuação',
        type: 'string',
      },
      leader: {
        title: 'Líder',
        type: 'string',
      },
    },
  };

  constructor(public utils: UtilsService) {}

  ngOnInit(): void {}

  openDialog(data: any): void {}
}
