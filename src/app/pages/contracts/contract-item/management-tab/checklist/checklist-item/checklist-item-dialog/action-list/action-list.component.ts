import { Component, Input, OnInit } from '@angular/core';
import { ChecklistItemAction, Contract } from '@models/contract';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import { User } from '@models/user';
import { NbCalendarRange } from '@nebular/theme';
import * as contract_validation from 'app/shared/contract-validation.json';
import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'ngx-action-list',
  templateUrl: './action-list.component.html',
  styleUrls: ['./action-list.component.scss'],
})
export class ActionListComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() itemIndex!: number;
  action: ChecklistItemAction = new ChecklistItemAction();
  validation = (contract_validation as any).default;
  yesterday = new Date();
  itemRange!: NbCalendarRange<Date>;
  invoice: Invoice = new Invoice();
  responsibleSearch = '';
  avaliableResponsibles: Observable<User[]> = of([]);

  constructor(
    private invoiceService: InvoiceService,
    private userService: UserService,
    private contractService: ContractService
  ) {}

  ngOnInit(): void {
    if (this.contract.invoice) {
      this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    }
    const today = new Date();
    this.yesterday.setDate(today.getDate() - 1);
    this.avaliableResponsibles = this.getAvaliableResponsibles();
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

  registerAction(): void {
    this.action.startDate = this.itemRange.start;
    if (this.itemRange.end) {
      this.action.endDate = this.itemRange.end;
    }
    this.contract.checklist[this.itemIndex].actionList.push(this.action);
    this.contractService.editContract(this.contract);
    this.action = new ChecklistItemAction();
    this.responsibleSearch = '';
    this.itemRange = { start: new Date() };
  }
}
