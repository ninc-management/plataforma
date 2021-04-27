import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from 'app/shared/services/user.service';
import { Subject } from 'rxjs';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService } from '@nebular/theme';
import { takeUntil } from 'rxjs/operators';
import { UserDialogComponent } from './user-dialog/user-dialog.component';

@Component({
  selector: 'ngx-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  users: any[] = [];
  searchQuery = '';
  get filtredUsers(): any[] {
    if (this.searchQuery !== '')
      return this.users.filter((contract) => {
        return (
          contract.fullName
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          contract.document
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          contract.phone
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          contract.email.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.users.sort((a, b) => {
      return a.fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '') <
        b.fullName.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        ? -1
        : 1;
    });
  }
  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum cliente para o filtro selecionado.',
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
    delete: {
      deleteButtonContent: '<i class="fa fa-dollar-sign payment"></i>',
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
      emailNortan: {
        title: 'Email Nortan',
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
    },
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(
    private dialogService: NbDialogService,
    private userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.userService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users: any[]) => {
        this.users = users;
        this.source.load(this.users);
      });
  }

  userDialog(event): void {
    this.dialogService.open(UserDialogComponent, {
      context: {
        title: 'EDIÇÃO DE ASSOCIADO',
        user: event.data,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: true,
      autoFocus: false,
    });
  }

  pageWidth(): number {
    return window.innerWidth;
  }
}
