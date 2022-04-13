import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Contract, ContractChecklistItem, DateRange } from '@models/contract';
import { Invoice } from '@models/invoice';
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
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { ChecklistItemDialogComponent } from './checklist-item-dialog/checklist-item-dialog.component';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { Message } from '@models/message';
import { MessageService } from 'app/shared/services/message.service';
import { TaskModel } from './gantt-chart/task-data.model';

@Component({
  selector: 'ngx-management-tab',
  templateUrl: './management-tab.component.html',
  styleUrls: ['./management-tab.component.scss'],
})
export class ManagementTabComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();
  @ViewChild('newCommentInput', { static: true }) commentInput!: ElementRef<HTMLInputElement>;
  @Input() iContract: Contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  avaliableAssignees$ = new BehaviorSubject<User[]>([]);
  invoice: Invoice = new Invoice();
  newChecklistItem = new ContractChecklistItem();
  deadline!: Date | undefined;
  currentUser: User = new User();

  avaliableContracts$: Observable<Contract[]> = of([]);
  managementAssignee = '';
  assigneeSearch = '';
  availableMessages: Message[] = [];

  modelSearch = '';
  newComment: Message = new Message();

  validation = (contract_validation as any).default;
  avaliableStatus = Object.values(AVALIABLE_MANAGEMENT_STATUS);
  avaliableItemStatus = Object.values(AVALIABLE_MANAGEMENT_ITEM_STATUS);
  isEditionGranted = false;
  isCommentGranted = false;
  taskData: TaskModel[] = [];

  constructor(
    public userService: UserService,
    public utils: UtilsService,
    private invoiceService: InvoiceService,
    private contractorService: ContractorService,
    private contractService: ContractService,
    private stringUtils: StringUtilService,
    private messageService: MessageService,
    private dialogService: NbDialogService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    if (this.iContract._id) {
      this.invoice = this.utils.idToProperty(
        this.iContract,
        this.contractService.idToContract.bind(this.contractService),
        'invoice'
      );
      this.avaliableAssignees$.next(this.invoiceService.teamMembers(this.invoice));
      this.userService.currentUser$.pipe(take(1)).subscribe((currentUser) => {
        this.currentUser = currentUser;
      });
      this.isCommentGranted =
        this.invoice.team.findIndex((teamMember) => this.userService.isEqual(teamMember.user, this.currentUser)) != -1;
      (this.managementAssignee = this.utils.idToProperty(
        this.invoice.author,
        this.userService.idToUser.bind(this.userService),
        'fullName'
      )),
        (this.deadline = this.contractService.deadline(this.iContract));
      this.avaliableContracts$ = this.contractService.getContracts();
      this.contractService.edited$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.iContract.invoice)
          this.avaliableAssignees$.next(this.invoiceService.teamMembers(this.iContract.invoice));
      });
      this.messageService
        .getMessages()
        .pipe(takeUntil(this.destroy$))
        .subscribe((messages) => {
          this.availableMessages = [];
          messages
            .filter((mFiltered) => this.contractService.isEqual(mFiltered.contract, this.iContract))
            .forEach((message) => {
              this.availableMessages.push(message);
            });
        });
      this.contractService
        .checkEditPermission(this.invoice)
        .pipe(take(1))
        .subscribe((isGranted) => {
          this.isEditionGranted = isGranted;
        });
    }
    const now = new Date();
    const now1_1 = new Date(new Date().setDate(now.getDate() + 3));
    const now1_2 = new Date(new Date().setDate(now.getDate() + 22));

    const now2_1 = new Date(new Date().setDate(now.getDate() + 25));
    const now2_2 = new Date(new Date().setDate(now.getDate() + 33));

    const now3_1 = new Date(new Date().setDate(now.getDate() - 30));
    const now3_2 = new Date(new Date().setDate(now.getDate() - 12));

    const now4_1 = new Date(new Date().setDate(now.getDate() + 33));
    const now4_2 = new Date(new Date().setDate(now.getDate() + 40));

    this.taskData = [
      {
        groupName: 'Group 1',
        groupOrder: 1,
        taskName: 'tarefa 1',
        taskId: 1,
        taskDependencies: [],
        start: now1_1,
        end: now1_2,
        donePercentage: 10,
        owner: '',
        image: 'http://carismartes.com.br/assets/global/images/avatars/avatar2_big@2x.png',
      },
      {
        groupName: 'Group 3',
        groupOrder: 3,
        taskName: 'tarefa 5',
        taskId: 5,
        taskDependencies: [1, 3],
        start: now1_1,
        end: now1_2,
        donePercentage: 30,
        owner: '',
        image: 'http://carismartes.com.br/assets/global/images/avatars/avatar1_big@2x.png',
      },
      {
        groupName: 'Group 2',
        groupOrder: 2,
        taskName: 'tarefa 2',
        taskId: 2,
        taskDependencies: [1],
        start: now2_1,
        end: now2_2,
        donePercentage: 10,
        owner: '',
        image: 'http://carismartes.com.br/assets/global/images/avatars/avatar3_big@2x.png',
      },
      {
        groupName: 'Group 3',
        groupOrder: 3,
        taskName: 'tarefa 3',
        taskId: 3,
        taskDependencies: [],
        start: now3_1,
        end: now3_2,
        donePercentage: 80,
        owner: '',
        image: 'http://carismartes.com.br/assets/global/images/avatars/avatar1_big@2x.png',
      },
      {
        groupName: 'Group 2',
        groupOrder: 2,
        taskName: 'tarefa 4',
        taskId: 4,
        taskDependencies: [2, 3],
        start: now4_1,
        end: now4_2,
        donePercentage: 60,
        owner: '',
        image: 'http://carismartes.com.br/assets/global/images/avatars/avatar4_big@2x.png',
      },
      {
        groupName: 'Group 2',
        groupOrder: 2,
        taskName: 'tarefa 6',
        taskId: 6,
        taskDependencies: [1, 3, 5],
        start: now2_1,
        end: now2_2,
        donePercentage: 100,
        owner: '',
        image: 'http://carismartes.com.br/assets/global/images/avatars/avatar1_big@2x.png',
      },
    ];
  }

  tooltipText(): string {
    if (this.invoice.contractor)
      return (
        `CPF/CNPJ: ` +
        this.contractorService.idToContractor(this.invoice.contractor).document +
        `\nEmail: ` +
        this.contractorService.idToContractor(this.invoice.contractor).email +
        `\nEndereço: ` +
        this.contractorService.idToContractor(this.invoice.contractor).address
      );
    return '';
  }

  updateContractManagement(): void {
    this.contractService.editContract(this.iContract);
  }

  totalDays(): number | undefined {
    if (this.deadline) {
      //can start be the start date from the initial checklist item?
      return differenceInCalendarDays(this.deadline, this.iContract.created);
    }
    return undefined;
  }

  remainingDays(): number | undefined {
    if (this.deadline) {
      const today = new Date();
      const remaining = differenceInCalendarDays(this.deadline, today);
      //Remaining days can't be a negative number
      return remaining > 0 ? remaining : 0;
    }
    return undefined;
  }

  percentualProgress(): number {
    //if the contract is created today, total is 0
    //remaining can be 0 but cant be undefined
    const total = this.totalDays();
    const remaining = this.remainingDays();
    if (total != undefined && total != 0 && remaining != undefined) {
      const progress = total - remaining;
      return this.stringUtils.moneyToNumber(this.stringUtils.toPercentageNumber(progress, total).slice(0, -1));
    }
    return 0;
  }

  registerChecklistItem(): void {
    this.newChecklistItem.range = this.newChecklistItem.range as DateRange;
    this.iContract.checklist.push(cloneDeep(this.newChecklistItem));
    this.newChecklistItem = new ContractChecklistItem();
    this.assigneeSearch = '';
    this.deadline = this.contractService.deadline(this.iContract);
  }

  itemTotalDays(item: ContractChecklistItem): number | undefined {
    if (item.range.end) return differenceInCalendarDays(item.range.end, item.range.start);
    return;
  }

  itemRemainingDays(item: ContractChecklistItem): number | undefined {
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

  percentualItemProgress(item: ContractChecklistItem): number {
    if (item.actionList.length > 0) {
      const completedActionsQtd = item.actionList.reduce((count, action) => (action.isFinished ? count + 1 : count), 0);
      return this.stringUtils.moneyToNumber(
        this.stringUtils.toPercentageNumber(completedActionsQtd, item.actionList.length).slice(0, -1)
      );
    }
    return 0;
  }

  itemProgressStatus(item: ContractChecklistItem): string {
    const progress = this.percentualItemProgress(item);
    if (progress == 100) {
      return 'success';
    } else {
      const remainingDays = this.itemRemainingDays(item);
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
          contract: this.iContract,
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
    this.iContract.checklist.splice(index, 1);
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
          this.iContract.checklist = cloneDeep(selectedContract.checklist);
        } else {
          this.modelSearch = '';
        }
        this.isDialogBlocked.next(false);
      });
  }

  registerNewComment(): void {
    this.newComment.created = new Date();
    this.newComment.author = this.currentUser;
    this.newComment.contract = this.iContract;
    this.messageService.saveMessage(this.newComment);
    this.newComment.body = '';
  }
}
