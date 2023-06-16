import { Component, OnInit } from '@angular/core';
import saveAs from 'file-saver';
import { combineLatest, skipWhile, Subject, takeUntil } from 'rxjs';

import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { generateExpensesReport } from 'app/shared/report-generator';
import { ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { codeSort, idToProperty, isPhone, nameSort } from 'app/shared/utils';

import { Contract } from '@models/contract';
import { Contractor } from '@models/contractor';
import { Invoice } from '@models/invoice';
import { User } from '@models/user';

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

  isPhone = isPhone;
  idToProperty = idToProperty;

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
      'invoice.author': {
        title: 'Autor',
        type: 'string',
        valuePrepareFunction: (author: User | string | undefined) =>
          author ? this.userService.idToShortName(author) : '',
        filterFunction: (author: User | string | undefined, search?: string): boolean => {
          return author && search
            ? this.userService.idToShortName(author).toLowerCase().includes(search.toLowerCase())
            : false;
        },
        compareFunction: (
          direction: number | undefined,
          a: User | string | undefined,
          b: User | string | undefined
        ) => {
          const a1 = a ? this.userService.idToShortName(a) : '';
          const a2 = b ? this.userService.idToShortName(b) : '';
          return nameSort(direction, a1, a2);
        },
      },
      'invoice.code': {
        title: 'Código',
        type: 'string',
        sortDirection: 'desc',
        compareFunction: codeSort,
      },
      'invoice.contractor': {
        title: 'Cliente',
        type: 'string',
        valuePrepareFunction: (contractor: Contractor | string | undefined) =>
          contractor ? this.contractorService.idToContractor(contractor).fullName : '',
        filterFunction: (contractor: Contractor | string | undefined, search?: string): boolean => {
          return contractor && search
            ? this.contractorService.idToContractor(contractor).fullName.toLowerCase().includes(search.toLowerCase())
            : false;
        },
        compareFunction: (
          direction: number | undefined,
          a: Contractor | string | undefined,
          b: Contractor | string | undefined
        ) => {
          const a1 = a ? this.contractorService.idToContractor(a).fullName : '';
          const a2 = b ? this.contractorService.idToContractor(b).fullName : '';
          return nameSort(direction, a1, a2);
        },
      },
      'invoice.name': {
        title: 'Empreendimento',
        type: 'string',
      },
    },
  };

  constructor(
    private contractService: ContractService,
    public invoiceService: InvoiceService,
    public userService: UserService,
    public contractorService: ContractorService
  ) {}

  ngOnInit(): void {
    combineLatest([this.contractService.getContracts(), this.contractService.isDataLoaded$])
      .pipe(
        skipWhile(([, isContractDataLoaded]) => !isContractDataLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([contracts, _]) => {
        this.contracts = contracts.map((contract) => this.contractService.fillContract(contract));
        this.source.load(contracts);
      });
  }

  getContractorName(invoice: Invoice | string | undefined): string {
    if (invoice) {
      invoice = this.invoiceService.idToInvoice(invoice);
      return idToProperty(
        invoice.contractor,
        this.contractorService.idToContractor.bind(this.contractorService),
        'fullName'
      );
    }
    return '';
  }

  downloadExpensesReport(contract: Contract): void {
    const csv = generateExpensesReport(contract);
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'relatorio_despesas.csv');
  }
}
