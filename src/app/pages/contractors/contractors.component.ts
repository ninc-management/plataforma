import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ContractorDialogComponent } from './contractor-dialog/contractor-dialog.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { ContractorService } from 'app/shared/services/contractor.service';
import { nameSort } from 'app/shared/utils';

import { Contractor } from '@models/contractor';

@Component({
  selector: 'ngx-contractors',
  templateUrl: './contractors.component.html',
  styleUrls: ['./contractors.component.scss'],
})
export class ContractorsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  contractors: Contractor[] = [];
  searchQuery = '';
  isDataLoaded = false;
  get filtredContractors(): Contractor[] {
    if (this.searchQuery !== '')
      return this.contractors.filter((contractor) => {
        return (
          contractor.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contractor.document.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contractor.address.streetAddress.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contractor.address.city.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contractor.address.state.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contractor.address.district.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          contractor.email.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.contractors.sort((a, b) => {
      return nameSort(1, a.fullName, b.fullName);
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
      add: true,
      edit: true,
      delete: false,
    },
    columns: {
      fullName: {
        title: 'Autor',
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
      corporateName: {
        title: 'Razão Social',
        type: 'string',
      },
      legalRepresentatives: {
        title: 'Representante Legal',
        type: 'string',
        valuePrepareFunction: (legalRepresentatives: any[]) => {
          return legalRepresentatives.map((legalRrepresentative: any) => legalRrepresentative.fullName);
        },
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(private dialogService: NbDialogService, private contractorService: ContractorService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.contractorService.isDataLoaded$
      .pipe(takeUntil(this.destroy$))
      .subscribe((reqContractor) => (this.isDataLoaded = reqContractor));
    this.contractorService
      .getContractors()
      .pipe(takeUntil(this.destroy$))
      .subscribe((contractors: any[]) => {
        this.contractors = contractors;
        this.source.load(this.contractors);
      });
  }

  contractorDialog(event: { data?: Contractor }): void {
    this.dialogService.open(ContractorDialogComponent, {
      context: {
        title: event.data ? 'EDIÇÃO DE CLIENTE' : 'CADASTRO DE CLIENTE',
        contractor: event.data ? event.data : new Contractor(),
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
