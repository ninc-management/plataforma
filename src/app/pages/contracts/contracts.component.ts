import { Component, OnInit, OnDestroy } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { ContractDialogComponent } from './contract-dialog/contract-dialog.component';
import { LocalDataSource } from 'ng2-smart-table';
import { ContractService } from '../../shared/services/contract.service';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'ngx-contracts',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss'],
})
export class ContractsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum contrato para o filtro selecionado.',
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
      delete: true,
    },
    columns: {
      fullName: {
        title: 'Autor',
        type: 'string',
      },
      code: {
        title: 'Código',
        type: 'string',
      },
      contractor: {
        title: 'Cliente',
        type: 'string',
      },
      name: {
        title: 'Empreendimento',
        type: 'string',
      },
      value: {
        title: 'Valor',
        type: 'string',
        width: '10%',
        compareFunction: this.valueSort,
      },
      status: {
        title: 'Status',
        type: 'string',
        width: '10%',
        filter: {
          type: 'list',
          config: {
            selectText: 'Status',
            list: [
              { value: 'Em adamento', title: 'Em adamento' },
              { value: 'Concluído', title: 'Concluído' },
              { value: 'Arquivado', title: 'Arquivado' },
            ],
          },
        },
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();

  constructor(
    private dialogService: NbDialogService,
    private contractService: ContractService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.contractService
      .getContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe((contracts: any[]) => {
        this.source.load(
          contracts.map((contract: any) => {
            if (!contract.fullName)
              contract.fullName = contract.invoice.author.fullName;
            if (!contract.code) contract.code = contract.invoice.code;
            if (!contract.contractor)
              contract.contractor = contract.invoice.contractor;
            if (!contract.value) contract.value = contract.invoice.value;
            if (!contract.name) contract.name = contract.invoice.name;
            return contract;
          })
        );
      });
  }

  contractDialog(event): void {
    this.dialogService.open(ContractDialogComponent, {
      context: {
        title: 'EDIÇÃO DE CONTRATO',
        contract: event.data,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }

  valueSort(direction: any, a: string, b: string): number {
    let first = +a.replace(/[,.]/g, '');
    let second = +b.replace(/[,.]/g, '');

    if (first < second) {
      return -1 * direction;
    }
    if (first > second) {
      return direction;
    }
    return 0;
  }
}
