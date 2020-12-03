import { Component, OnInit, OnDestroy } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { ContractDialogComponent } from './contract-dialog/contract-dialog.component';
import { LocalDataSource } from 'ng2-smart-table';
import { ContractService } from '../../shared/services/contract.service';
import { ContractorService } from '../../shared/services/contractor.service';
import { InvoiceService } from '../../shared/services/invoice.service';
import { UserService } from '../../shared/services/user.service';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'ngx-contracts',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss'],
})
export class ContractsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  contracts: any[] = [];
  searchQuery = '';
  get filtredContracts(): any[] {
    if (this.searchQuery !== '')
      return this.contracts.filter((contract) => {
        return (
          contract.fullName
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          contract.code
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          contract.contractor
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          contract.name
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          contract.value
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase()) ||
          contract.status.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    return this.contracts.sort((a, b) => this.codeSort(-1, a.code, b.code));
  }
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
        sortDirection: 'desc',
        compareFunction: this.codeSort,
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
    private contractService: ContractService,
    private contractorService: ContractorService,
    private invoiceService: InvoiceService,
    private userService: UserService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* eslint-disable @typescript-eslint/indent */
  ngOnInit(): void {
    this.invoiceService //TODO: Improve this dependence loading
      .getInvoices()
      .pipe(take(2))
      .subscribe((invoices) => {
        if (invoices.length > 0)
          this.contractService
            .getContracts()
            .pipe(takeUntil(this.destroy$))
            .subscribe((contracts: any[]) => {
              this.contracts = contracts.map((contract: any) => {
                if (contract.invoice?.author == undefined)
                  contract.invoice = this.invoiceService.idToInvoice(
                    contract.invoice
                  );
                if (!contract.fullName)
                  contract.fullName = contract.invoice.author?.fullName
                    ? contract.invoice.author.fullName
                    : this.userService.idToName(contract.invoice.author);
                if (!contract.code) contract.code = contract.invoice.code;
                if (!contract.contractor)
                  contract.contractor = contract.invoice.contractor?.fullName
                    ? contract.invoice.contractor.fullName
                    : this.contractorService.idToName(
                        contract.invoice.contractor
                      );
                if (!contract.value) contract.value = contract.invoice.value;
                if (!contract.name) contract.name = contract.invoice.name;
                return contract;
              });
              this.source.load(this.contracts);
            });
      });
  }
  /* eslint-enable @typescript-eslint/indent */

  contractDialog(event, isEditing: boolean): void {
    this.dialogService.open(ContractDialogComponent, {
      context: {
        title: isEditing ? 'EDIÇÃO DE CONTRATO' : 'ADICIONAR ORDEM DE EMPENHO',
        contract: event.data,
        contractIndex: +event.index,
        isEditing: isEditing,
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

  statusColor(status: string): string {
    switch (status) {
      case 'Em andamento':
        return 'warning';
      case 'Concluído':
        return 'success';
      case 'Arquivado':
        return 'danger';
    }
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

  codeSort(direction: any, a: string, b: string): number {
    let first = +a.match(/-(\d+)\//g)[0].match(/\d+/g)[0];
    let second = +b.match(/-(\d+)\//g)[0].match(/\d+/g)[0];

    if (first < second) {
      return -1 * direction;
    }
    if (first > second) {
      return direction;
    }
    return 0;
  }
}
