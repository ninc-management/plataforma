import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Contract, ContractChecklistItem, DateRange } from '@models/contract';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import { User } from '@models/user';
import { NbDialogService } from '@nebular/theme';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import * as contract_validation from 'app/shared/contract-validation.json';
import {
  AVALIABLE_MANAGEMENT_STATUS,
  AVALIABLE_MANAGEMENT_ITEM_STATUS,
  ContractService,
} from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { differenceInCalendarDays, isBefore } from 'date-fns';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { ChecklistItemDialogComponent } from './checklist-item-dialog/checklist-item-dialog.component';
import { Caret } from 'textarea-caret-ts';
import { StringUtilService } from 'app/shared/services/string-util.service';

//Tipo local para testes
class ChatComment {
  body: string = '';
  author!: User;
  created!: Date;
}

@Component({
  selector: 'ngx-management-tab',
  templateUrl: './management-tab.component.html',
  styleUrls: ['./management-tab.component.scss'],
})
export class ManagementTabComponent implements OnInit {
  @ViewChild('newCommentInput', { static: true }) commentInput!: ElementRef<HTMLInputElement>;
  @Input() iContract: Contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  contract: Contract = new Contract();
  invoice: Invoice = new Invoice();
  newChecklistItem = new ContractChecklistItem();
  deadline!: Date | undefined;

  avaliableAssignees: Observable<User[]> = of([]);
  avaliableContracts: Observable<Contract[]> = of([]);
  managementAssignee = '';
  assigneeSearch = '';
  modelSearch = '';

  newComment: ChatComment = new ChatComment();
  isTargetSelectionActive = false;
  commentTargetSearch = '';
  commentTarget!: User;
  comments: ChatComment[] = [];
  caretPosition!: Caret.Position;

  validation = (contract_validation as any).default;
  avaliableStatus = Object.values(AVALIABLE_MANAGEMENT_STATUS);
  avaliableItemStatus = Object.values(AVALIABLE_MANAGEMENT_ITEM_STATUS);

  constructor(
    public userService: UserService,
    public utils: UtilsService,
    private invoiceService: InvoiceService,
    private contractorService: ContractorService,
    private contractService: ContractService,
    private dialogService: NbDialogService,
    private stringUtils: StringUtilService
  ) {}

  ngOnInit(): void {
    this.contract = cloneDeep(this.iContract);
    if (this.contract.invoice) {
      this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    }
    this.managementAssignee = this.userService.idToName(this.invoice.author);
    this.deadline = this.contractService.getDeadline(this.contract);
    this.avaliableAssignees = this.getAvaliableAssignees();
    this.avaliableContracts = this.contractService.getContracts();
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.newComment.author = user;
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
      return this.stringUtils.moneyToNumber(this.stringUtils.toPercentageNumber(progress, total).slice(0, -1));
    }
    return 0;
  }

  getAvaliableAssignees(): Observable<User[]> {
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
    this.contract.checklist.push(cloneDeep(this.newChecklistItem));
    this.newChecklistItem = new ContractChecklistItem();
    this.assigneeSearch = '';
    this.deadline = this.contractService.getDeadline(this.contract);
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
    if (item.actionList.length > 0) {
      const completedActionsQtd = item.actionList.reduce((count, action) => (action.isFinished ? count + 1 : count), 0);
      return this.stringUtils.moneyToNumber(
        this.stringUtils.toPercentageNumber(completedActionsQtd, item.actionList.length).slice(0, -1)
      );
    }
    return 0;
  }

  getItemProgressStatus(item: ContractChecklistItem): string {
    const progress = this.getPercentualItemProgress(item);
    if (progress == 100) {
      return 'success';
    } else {
      const remainingDays = this.getItemRemainingDays(item);
      if (remainingDays != undefined) {
        if (remainingDays <= 2) {
          return 'danger';
        }
        if (remainingDays <= 7) {
          return 'warning';
        }
      }
    }
    return 'primary';
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
    this.contract.checklist.splice(index, 1);
  }

  applyManagementModel(selectedContract: Contract): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(ConfirmationDialogComponent, {
        context: {
          question:
            'Você tem certeza que deseja importar a checklist do contrato ' +
            selectedContract.code +
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
          this.contract.checklist = cloneDeep(selectedContract.checklist);
        } else {
          this.modelSearch = '';
        }
        this.isDialogBlocked.next(false);
      });
  }

  isAtSign($event: KeyboardEvent): void {
    if ($event.key == '@') {
      this.isTargetSelectionActive = true;
      this.caretPosition = Caret.getRelativePosition(this.commentInput.nativeElement);
      this.caretPosition.top += 14;
      this.caretPosition.left += 33;
    }
  }

  onTargetSelected($event: User): void {
    this.newComment.body += $event.fullName.replace(/\s/g, '') + ' ';
    this.commentTargetSearch = '';
    this.isTargetSelectionActive = false;
  }

  registerNewComment(): void {
    this.newComment.created = new Date();
    this.comments.push(cloneDeep(this.newComment));
    this.newComment.body = '';
  }
}
