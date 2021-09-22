import { Component, Input, OnInit } from '@angular/core';
import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import * as contract_validation from 'app/shared/contract-validation.json';
import { ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';

@Component({
  selector: 'ngx-management-tab',
  templateUrl: './management-tab.component.html',
  styleUrls: ['./management-tab.component.scss'],
})
export class ManagementTabComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  validation = (contract_validation as any).default;
  invoice: Invoice = new Invoice();
  responsible = '';

  avaliableStatus = [
    'Produção',
    'Análise Externa',
    'Espera',
    'Prioridade',
    'Finalização',
    'Concluído',
  ];

  constructor(
    private invoiceService: InvoiceService,
    private contractorService: ContractorService,
    private userService: UserService,
    public utils: UtilsService,
    private contractService: ContractService
  ) {}

  ngOnInit(): void {
    if (this.contract.invoice) {
      this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    }
    this.responsible = this.userService.idToName(this.invoice.author);
  }

  tooltipText(): string {
    if (this.contract.invoice) {
      const invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      if (invoice.contractor)
        return (
          `CPF/CNPJ: ` +
          this.contractorService.idToContractor(invoice.contractor).document +
          `\nEmail: ` +
          this.contractorService.idToContractor(invoice.contractor).email +
          `\nEndereço: ` +
          this.contractorService.idToContractor(invoice.contractor).address
        );
    }
    return '';
  }

  updateContractManagment(): void {
    this.contractService.editContract(this.contract);
  }
}
