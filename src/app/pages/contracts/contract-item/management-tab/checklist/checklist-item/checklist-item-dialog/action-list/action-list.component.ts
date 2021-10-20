import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ChecklistItemAction, Contract, ContractChecklistItem } from '@models/contract';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import { User } from '@models/user';
import { NbCalendarRange } from '@nebular/theme';
import * as contract_validation from 'app/shared/contract-validation.json';
import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { cloneDeep } from 'lodash';
import { Observable, of } from 'rxjs';

interface ActionItem extends ChecklistItemAction {
  range?: {
    start: Date;
    end?: Date;
  };
}

@Component({
  selector: 'ngx-action-list',
  templateUrl: './action-list.component.html',
  styleUrls: ['./action-list.component.scss'],
})
export class ActionListComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() itemIndex!: number;
  @ViewChild('form') form!: NgForm;
  action: ActionItem = new ChecklistItemAction();
  validation = (contract_validation as any).default;
  yesterday = new Date();
  newActionRange!: NbCalendarRange<Date>;
  invoice: Invoice = new Invoice();
  responsibleSearch = '';
  avaliableResponsibles: Observable<User[]> = of([]);
  checklistItem = new ContractChecklistItem();
  actionList!: ActionItem[];

  constructor(
    private invoiceService: InvoiceService,
    public userService: UserService,
    private contractService: ContractService,
    private utils: UtilsService
  ) {}

  ngOnInit(): void {
    if (this.contract.invoice) {
      this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    }
    this.checklistItem = cloneDeep(this.contract.checklist[this.itemIndex]);
    this.actionList = cloneDeep(this.checklistItem.actionList);
    this.actionList = this.actionList.map((action) => {
      action.range = {
        start: new Date(action.startDate),
        end: new Date(action.endDate),
      };
      return action;
    });
    const today = new Date();
    this.yesterday.setDate(today.getDate() - 1);
    this.avaliableResponsibles = this.getAvaliableResponsibles();
  }

  getAvaliableResponsibles(): Observable<User[]> {
    return of(
      this.invoice.team
        .map((member: InvoiceTeamMember) => {
          return member.user ? this.userService.idToUser(member.user) : undefined;
        })
        .filter((user: User | undefined): user is User => user !== undefined)
    );
  }

  registerAction(): void {
    this.action.startDate = this.newActionRange.start;
    this.action.range = {
      start: this.newActionRange.start,
    };
    if (this.newActionRange.end) {
      this.action.endDate = this.newActionRange.end;
      this.action.range.end = this.newActionRange.end;
    }

    if (this.itemIndex !== undefined) {
      this.actionList.push(cloneDeep(this.action));
      this.action = new ChecklistItemAction();
      this.responsibleSearch = '';
      this.newActionRange = { start: new Date() };
    }
  }

  removeAction(index: number): void {
    this.actionList.splice(index, 1);
  }

  updateAction(): void {
    this.checklistItem.actionList = this.actionList;
    this.contract.checklist[this.itemIndex] = cloneDeep(this.checklistItem);
    this.contractService.editContract(this.contract);
  }

  getFormattedRange(range: any): string | undefined {
    if (range.end) {
      return this.utils.formatDate(range.start) + ' - ' + this.utils.formatDate(range.end);
    }
    return this.utils.formatDate(range.start);
  }
}
