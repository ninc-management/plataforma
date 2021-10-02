import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { Subject } from 'rxjs';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogService } from '@nebular/theme';
import { takeUntil } from 'rxjs/operators';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { User } from '@models/user';

@Component({
  selector: 'ngx-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  users: User[] = [];
  searchQuery = '';
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
      return this.utils.nameSort(1, a.fullName, b.fullName);
    });
  }
  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum usuário para o filtro selecionado.',
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

  constructor(private dialogService: NbDialogService, private userService: UserService, public utils: UtilsService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.userService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe((users: User[]) => {
        this.users = users;
        this.source.load(this.users);
      });
  }

  userDialog(event: { data?: User }): void {
    this.dialogService.open(UserDialogComponent, {
      context: {
        title: 'EDIÇÃO DE ASSOCIADO',
        user: event.data ? event.data : new User(),
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
