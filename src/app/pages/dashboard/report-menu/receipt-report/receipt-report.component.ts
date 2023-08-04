import { Component, OnInit } from '@angular/core';
import saveAs from 'file-saver';
import { combineLatest, skipWhile, take } from 'rxjs';

import { ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { codeSort, formatDate, idToProperty } from 'app/shared/utils';

import { Contract, DateRange } from '@models/contract';

@Component({
  selector: 'ngx-receipt-report',
  templateUrl: './receipt-report.component.html',
  styleUrls: ['./receipt-report.component.scss'],
})
export class ReceiptReportComponent implements OnInit {
  contracts: Contract[] = [];
  dateInterval!: DateRange;

  constructor(
    private contractService: ContractService,
    private contractorService: ContractorService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.contractService.getContracts(),
      this.contractorService.getContractors(),
      this.invoiceService.getInvoices(),
      this.contractService.isDataLoaded$,
      this.contractorService.isDataLoaded$,
      this.invoiceService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(
          ([, , isContractDataLoaded, isContractorDataLoaded, isInvoiceDataLoaded]) =>
            !(isContractDataLoaded && isContractorDataLoaded && isInvoiceDataLoaded)
        ),
        take(1)
      )
      .subscribe(([contracts, , , , ,]) => {
        this.contracts = contracts.map((contract) => this.contractService.fillContract(contract));
      });
  }

  createReportObject(contracts: Contract[]): string {
    const mainHeaders = [
      'Nº da OE no Contrato',
      'Nº do Contrato',
      'Data de Emissão da Proposta',
      'Data de Fechamento do Contrato',
      'Valor',
      'Data de Criação',
      'Data de Pagamento',
      'Previsão de pagamento',
      'Cliente',
      'Email',
      'Celular',
    ];

    let csv = mainHeaders.join(';') + '\r\n';

    contracts
      .sort((a, b) =>
        codeSort(
          1,
          idToProperty(a.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code'),
          idToProperty(b.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code')
        )
      )
      .forEach((contract) => {
        contract.receipts.forEach((receipt, idx) => {
          if (
            contract.invoice &&
            this.dateInterval.end &&
            receipt.created >= this.dateInterval.start &&
            receipt.created <= this.dateInterval.end
          ) {
            const invoice = this.invoiceService.idToInvoice(contract.invoice);
            if (invoice.contractor) {
              const contractor = this.contractorService.idToContractor(invoice.contractor);
              csv += `#${idx + 1}` + ';';
              csv +=
                idToProperty(contract.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code') + ';';
              csv += formatDate(invoice.created) + ';';
              csv += formatDate(contract.created) + ';';
              csv += receipt.value + ';';
              csv += formatDate(receipt.created) + ';';
              csv += (receipt.paidDate ? formatDate(receipt.paidDate) : '') + ';';
              csv += (receipt.dueDate ? formatDate(receipt.dueDate) : '') + ';';
              csv += contractor.fullName.replace(/\;/g, '/') + ';';
              csv += contractor.email.replace(/\;/g, '/') + ';';
              csv += contractor.phone.replace(/\;/g, '/');
              csv += '\r\n';
            }
          }
        });
      });

    return csv;
  }

  downloadReport() {
    const filteredContracts = this.contracts.filter((contract) => contract.receipts.length > 0);
    const csv = this.createReportObject(filteredContracts);
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'relatorio_ordem_de_empenho.csv');
  }
}
