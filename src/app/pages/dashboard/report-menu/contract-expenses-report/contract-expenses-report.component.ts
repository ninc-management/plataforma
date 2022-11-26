import { Component, OnInit } from '@angular/core';
import saveAs from 'file-saver';
import { combineLatest, skipWhile, Subject, takeUntil } from 'rxjs';

import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { generateExpensesReport } from 'app/shared/report-generator';
import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { codeSort, isPhone } from 'app/shared/utils';

import { Contract } from '@models/contract';

@Component({
  selector: 'ngx-contract-expenses-report',
  templateUrl: './contract-expenses-report.component.html',
  styleUrls: ['./contract-expenses-report.component.scss'],
})
export class ContractExpensesReportComponent implements OnInit {
  destroy$ = new Subject<void>();
  source: LocalDataSource = new LocalDataSource();
  searchQuery = '';
  contracts: Contract[] = [];

  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhum contrato para o filtro selecionado.',
    edit: {
      editButtonContent: '<i class="icon-file-csv"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    actions: {
      columnTitle: 'Ações',
      add: false,
      edit: true,
      delete: false,
    },
    columns: {
      'locals.name': {
        title: 'Autor',
        type: 'string',
      },
      'locals.code': {
        title: 'Código',
        type: 'string',
        sortDirection: 'desc',
        compareFunction: codeSort,
      },
      'locals.contractor': {
        title: 'Cliente',
        type: 'string',
      },
      'locals.description': {
        title: 'Empreendimento',
        type: 'string',
      },
    },
  };

  isPhone = isPhone;

  constructor(private contractService: ContractService, public invoiceService: InvoiceService) {}

  ngOnInit(): void {
    combineLatest([this.contractService.getContracts(), this.contractService.isDataLoaded$])
      .pipe(
        skipWhile(([, isContractDataLoaded]) => !isContractDataLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([contracts, _]) => {
        contracts.forEach((contract) => this.contractService.fillContract(contract));
        this.contracts = contracts;
        this.source.load(contracts);
      });
  }

  downloadExpensesReport(contract: Contract): void {
    const csv = generateExpensesReport(contract);
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'relatorio_despesas.csv');
  }
}
