import { Component, Input, OnInit } from '@angular/core';
import { Contract, ContractChecklistItem } from '@models/contract';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import { User } from '@models/user';
import * as contract_validation from 'app/shared/contract-validation.json';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { Observable, of } from 'rxjs';

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
  newChecklistItem = new ContractChecklistItem();
  today = new Date();
  yesterday = new Date();
  responsibleSearch = '';
  avaliableResponsibles: Observable<User[]> = of([]);

  managementStatus = '';
  avaliableStatus = [
    'Produção',
    'Análise Externa',
    'Espera',
    'Prioridade',
    'Finalização',
    'Concluído',
  ];

  avaliableActionStatus = [
    'Briefing',
    'Anteprojeto',
    'Estudo preliminar',
    'Projeto básico',
    'Projeto executivo',
    'Campo',
    'Prioridade',
    'Análise externa',
    'Espera',
    'Finalização',
    'Concluído',
  ];

  constructor(
    private invoiceService: InvoiceService,
    private contractorService: ContractorService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    if (this.contract.invoice) {
      this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    }
    this.responsible = this.userService.idToName(this.invoice.author);
    this.yesterday.setDate(this.today.getDate() - 1);

    this.avaliableResponsibles = of(
      this.invoice.team
        .map((member: InvoiceTeamMember): User | undefined => {
          if (member.user) return this.userService.idToUser(member.user);
          return;
        })
        .filter((user: User | undefined): user is User => user !== undefined)
    );
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

  registerChecklistItem(): void {
    this.contract.checklist.push(this.newChecklistItem);
    this.newChecklistItem = new ContractChecklistItem();
    console.log(this.contract.checklist);
  }
}
