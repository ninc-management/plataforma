import { Component, Input, OnInit } from '@angular/core';
import { Contract, ContractChecklistItem } from '@models/contract';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import { User } from '@models/user';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { Observable, of } from 'rxjs';
import * as contract_validation from 'app/shared/contract-validation.json';
import { ContractService } from 'app/shared/services/contract.service';

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
    private userService: UserService,
    private contractService: ContractService
  ) {}

  ngOnInit(): void {
    if (this.contract.invoice) {
      this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    }
    this.avaliableResponsibles = this.getAvaliableResponsibles();
    this.yesterday.setDate(this.today.getDate() - 1);
  }

  getAvaliableResponsibles(): Observable<User[]> {
    return of(
      this.invoice.team
        .map((member: InvoiceTeamMember) => {
          return member.user
            ? this.userService.idToUser(member.user)
            : undefined;
        })
        .filter((user: User | undefined): user is User => user !== undefined)
    );
  }

  registerChecklistItem(): void {
    this.contract.checklist.push(this.newChecklistItem);
    this.contractService.editContract(this.contract);
    this.newChecklistItem = new ContractChecklistItem();
    this.responsibleSearch = '';
  }
}
