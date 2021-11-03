import { Component, Input, OnInit } from '@angular/core';
import { Contract, ContractChecklistItem } from '@models/contract';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import { User } from '@models/user';
import { NbCalendarRange, NbDialogService } from '@nebular/theme';
import * as contract_validation from 'app/shared/contract-validation.json';
import { ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { differenceInCalendarDays, isBefore } from 'date-fns';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { ChecklistItemDialogComponent } from './checklist/checklist-item/checklist-item-dialog/checklist-item-dialog.component';

interface DateRange {
  start: Date;
  end: Date;
}

interface Item extends ContractChecklistItem {
  range?: DateRange;
}

@Component({
  selector: 'ngx-management-tab',
  templateUrl: './management-tab.component.html',
  styleUrls: ['./management-tab.component.scss'],
})
export class ManagementTabComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  validation = (contract_validation as any).default;
  invoice: Invoice = new Invoice();
  responsible = '';
  deadline!: Date | undefined;
  itemRange!: NbCalendarRange<Date>;
  newChecklistItem = new ContractChecklistItem();
  itemResponsibleSearch = '';
  avaliableResponsibles: Observable<User[]> = of([]);
  checklist!: Item[];

  avaliableStatus = ['Produção', 'Análise Externa', 'Espera', 'Prioridade', 'Finalização', 'Concluído'];

  avaliableItemStatus = [
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
    public userService: UserService,
    public utils: UtilsService,
    private invoiceService: InvoiceService,
    private contractorService: ContractorService,
    private contractService: ContractService,
    private dialogService: NbDialogService
  ) {}

  ngOnInit(): void {
    if (this.contract.invoice) {
      this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    }
    this.responsible = this.userService.idToName(this.invoice.author);
    this.deadline = this.contractService.getDeadline(this.contract);
    this.avaliableResponsibles = this.getAvaliableResponsibles();
    this.checklist = cloneDeep(this.contract.checklist);
    this.checklist = this.checklist.map((item) => {
      item.range = {
        start: new Date(item.startDate),
        end: new Date(item.endDate),
      } as DateRange;
      return item;
    });
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

  getAvaliableResponsibles(): Observable<User[]> {
    return of(
      this.invoice.team
        .map((member: InvoiceTeamMember) => {
          return member.user ? this.userService.idToUser(member.user) : undefined;
        })
        .filter((user: User | undefined): user is User => user !== undefined)
    );
  }

  registerChecklistItem(): void {
    this.newChecklistItem.startDate = this.itemRange.start;
    if (this.itemRange.end) {
      this.newChecklistItem.endDate = this.itemRange.end;
    }
    this.contract.checklist.push(this.newChecklistItem);
    this.contractService.editContract(this.contract);
    this.newChecklistItem = new ContractChecklistItem();
    this.itemResponsibleSearch = '';
    this.itemRange = { start: new Date() };
  }

  getItemTotalDays(item: ContractChecklistItem): number {
    return differenceInCalendarDays(new Date(item.endDate), new Date(item.startDate));
  }

  getItemRemainingDays(item: ContractChecklistItem): number {
    const today = new Date();
    const itemStartDate = new Date(item.startDate);
    const end = new Date(item.endDate);
    if (isBefore(today, itemStartDate)) {
      const difference = differenceInCalendarDays(end, itemStartDate);
      return difference >= 0 ? difference : 0;
    }

    const difference = differenceInCalendarDays(end, today);
    return difference >= 0 ? difference : 0;
  }

  getPercentualItemProgress(item: ContractChecklistItem): number {
    const total = this.getItemTotalDays(item);
    const remaining = this.getItemRemainingDays(item);
    if (total != 0) {
      const progress = total - remaining;
      return +((progress / total) * 100).toFixed(2);
    }
    return 0;
  }

  openItemDialog(index: number): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(ChecklistItemDialogComponent, {
        context: {
          contract: this.contract,
          itemIndex: index,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.isDialogBlocked.next(false);
      });
  }

  removeItem(index: number): void {
    this.checklist.splice(index, 1);
  }
}
