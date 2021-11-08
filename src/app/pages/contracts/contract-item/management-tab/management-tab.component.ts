import { Component, Input, OnInit } from '@angular/core';
import { Contract, ContractChecklistItem, DateRange } from '@models/contract';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import { User } from '@models/user';
import { NbDialogService } from '@nebular/theme';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
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
import { ChecklistItemDialogComponent } from './checklist-item-dialog/checklist-item-dialog.component';

@Component({
  selector: 'ngx-management-tab',
  templateUrl: './management-tab.component.html',
  styleUrls: ['./management-tab.component.scss'],
})
export class ManagementTabComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() isDialogBlocked!: BehaviorSubject<boolean>;
  invoice: Invoice = new Invoice();
  newChecklistItem = new ContractChecklistItem();
  deadline!: Date | undefined;
  avaliableResponsibles: Observable<User[]> = of([]);
  avaliableContracts: Observable<Contract[]> = of([]);
  checklist!: ContractChecklistItem[];
  validation = (contract_validation as any).default;
  managementResponsible = '';
  responsibleSearch = '';
  modelSearch = '';

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
    this.managementResponsible = this.userService.idToName(this.invoice.author);
    this.deadline = this.contractService.getDeadline(this.contract);
    this.avaliableResponsibles = this.getAvaliableResponsibles();
    this.avaliableContracts = this.contractService.getContracts();
    this.checklist = cloneDeep(this.contract.checklist);
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
    this.contract.checklist = cloneDeep(this.checklist);
    this.contractService.editContract(this.contract);
  }

  getTotalDays(): number | undefined {
    if (this.deadline) {
      //can start be the start date from the initial checklist item?
      return differenceInCalendarDays(this.deadline, this.contract.created);
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
    this.newChecklistItem.range = this.newChecklistItem.range as DateRange;
    this.checklist.push(this.newChecklistItem);
    this.newChecklistItem = new ContractChecklistItem();
    this.responsibleSearch = '';
  }

  getItemTotalDays(item: ContractChecklistItem): number | undefined {
    if (item.range.end) return differenceInCalendarDays(item.range.end, item.range.start);
    return;
  }

  getItemRemainingDays(item: ContractChecklistItem): number | undefined {
    if (item.range.end) {
      const today = new Date();
      if (isBefore(today, item.range.start)) {
        const difference = differenceInCalendarDays(item.range.end, item.range.start);
        return difference >= 0 ? difference : 0;
      }

      const difference = differenceInCalendarDays(item.range.end, today);
      return difference >= 0 ? difference : 0;
    }
    return;
  }

  getPercentualItemProgress(item: ContractChecklistItem): number {
    const total = this.getItemTotalDays(item);
    const remaining = this.getItemRemainingDays(item);
    if (total != 0 && total && remaining) {
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
        closeOnEsc: true,
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

  applyManagementModel(contract: Contract): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(ConfirmationDialogComponent, {
        context: {
          question:
            'Você tem certeza que deseja importar a checklist do contrato ' +
            contract.code +
            '? Os dados atuais serão apagados.',
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((response) => {
        if (response) {
          this.checklist = cloneDeep(contract.checklist);
          this.contract.checklist = this.checklist;
        } else {
          this.modelSearch = '';
        }
        this.isDialogBlocked.next(false);
      });
  }
}
