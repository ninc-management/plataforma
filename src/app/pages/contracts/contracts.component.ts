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
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
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
              contract.fullName = contract.author.fullName;
            return contract;
          })
        );
      });
  }

  contractDialog(event): void {
    this.dialogService.open(ContractDialogComponent, {
      context: {
        title: event.data ? 'EDIÇÃO DE CONTRATO' : 'CADASTRO DE CONTRATO',
        contract: event.data,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: true,
      closeOnEsc: true,
    });
  }
}
