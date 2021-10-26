import { Component, Input, OnInit } from '@angular/core';
import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import * as contract_validation from 'app/shared/contract-validation.json';
import { ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { differenceInCalendarDays } from 'date-fns';

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
  deadline!: Date | undefined;

  avaliableStatus = ['Produção', 'Análise Externa', 'Espera', 'Prioridade', 'Finalização', 'Concluído'];

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
    this.deadline = this.contractService.getDeadline(this.contract);
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

  updateContractManagement(): void {
    this.contractService.editContract(this.contract);
  }

  getTotalDays(): number | undefined {
    if (this.deadline) {
      //can start be the start date from the initial checklist item?
      const start = new Date(this.contract.created);
      return differenceInCalendarDays(this.deadline, start);
    }
    return undefined;
  }

  getRemainingDays(): number | undefined {
    if (this.deadline) {
      const today = new Date();
      const remaining = differenceInCalendarDays(this.deadline, today);
      //Remaining days can't be a negative number
      return remaining > 0 ? remaining : 0;
    }
    return undefined;
  }

  getPercentualProgress(): number {
    //if the contract is created today, total is 0
    //remaining can be 0 but cant be undefined
    const total = this.getTotalDays();
    const remaining = this.getRemainingDays();
    if (total != undefined && total != 0 && remaining != undefined) {
      const progress = total - remaining;
      return +((progress / total) * 100).toFixed(2);
    }
    return 0;
  }
}
