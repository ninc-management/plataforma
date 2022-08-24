import { Component, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Subject, takeUntil } from 'rxjs';

import { ProviderDialogComponent } from './provider-dialog/provider-dialog/provider-dialog.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { ProviderService } from 'app/shared/services/provider.service';
import { nameSort } from 'app/shared/utils';

import { Provider } from '@models/provider';

@Component({
  selector: 'providers',
  templateUrl: './providers.component.html',
  styleUrls: ['./providers.component.scss'],
})
export class ProvidersComponent implements OnInit {
  private destroy$ = new Subject<void>();
  providers: Provider[] = [];
  searchQuery = '';
  isDataLoaded = false;
  get filtredProviders(): Provider[] {
    if (this.searchQuery !== '')
      return this.providers.filter((providers) => {
        return (
          providers.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          providers.document.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          providers.address.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          providers.email.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.providers.sort((a, b) => {
      return nameSort(1, a.fullName, b.fullName);
    });
  }
  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum fornecedor para o filtro selecionado.',
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
      add: true,
      edit: true,
      delete: false,
    },
    columns: {
      fullName: {
        title: 'Fornecedor',
        type: 'string',
      },
      document: {
        title: 'CPF/CNPJ',
        type: 'string',
      },
      email: {
        title: 'Email',
        type: 'string',
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(private dialogService: NbDialogService, private providerService: ProviderService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.providerService.isDataLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe((reqProvider) => (this.isDataLoaded = reqProvider));
    this.providerService
      .getProviders()
      .pipe(takeUntil(this.destroy$))
      .subscribe((providers: any[]) => {
        this.providers = providers;
        this.source.load(this.providers);
      });
  }

  providerDialog(event: { data?: Provider }): void {
    this.dialogService.open(ProviderDialogComponent, {
      context: {
        title: event.data ? 'EDIÇÃO DE FORNECEDOR' : 'CADASTRO DE FORNECEDOR',
        provider: event.data ? event.data : new Provider(),
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
  pageWidth(): number {
    return window.innerWidth;
  }
}
