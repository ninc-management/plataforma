import { Component, Input, OnInit } from '@angular/core';
import { Contract, ContractChecklistItem } from '@models/contract';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import { User } from '@models/user';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { Observable, of } from 'rxjs';
import * as contract_validation from 'app/shared/contract-validation.json';

@Component({
  selector: 'ngx-checklist',
  templateUrl: './checklist.component.html',
  styleUrls: ['./checklist.component.scss'],
})
export class ChecklistComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  invoice: Invoice = new Invoice();
  validation = (contract_validation as any).default;
  newChecklistItem = new ContractChecklistItem();
  today = new Date();
  yesterday = new Date();
  responsibleSearch = '';
  avaliableResponsibles: Observable<User[]> = of([]);

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
    private userService: UserService
  ) {
    if (this.contract.invoice) {
      this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    }
  }

  ngOnInit(): void {
    this.avaliableResponsibles = of(
      this.invoice.team
        .map((member: InvoiceTeamMember): User | undefined => {
          if (member.user) return this.userService.idToUser(member.user);
          return;
        })
        .filter((user: User | undefined): user is User => user !== undefined)
    );
    this.yesterday.setDate(this.today.getDate() - 1);
  }

  registerChecklistItem(): void {
    this.contract.checklist.push(this.newChecklistItem);
    this.newChecklistItem = new ContractChecklistItem();
    console.log(this.contract.checklist);
  }
}
