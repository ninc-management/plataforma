import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { NbDialogService } from '@nebular/theme';
import { differenceInCalendarDays, isAfter, isBefore, isSameDay } from 'date-fns';
import { cloneDeep, isEqual } from 'lodash';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

import { ChecklistItemDialogComponent } from './checklist-item-dialog/checklist-item-dialog.component';
import { TaskModel } from 'app/shared/components/charts/gantt-chart/task-data.model';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import {
  AVALIABLE_MANAGEMENT_ITEM_STATUS,
  AVALIABLE_MANAGEMENT_STATUS,
  ContractService,
} from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { MessageService } from 'app/shared/services/message.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { formatDate, idToProperty, isOfType, isPhone, trackByIndex } from 'app/shared/utils';

import { ChecklistItemAction, ChecklistItemLocals, Contract, ContractChecklistItem, DateRange } from '@models/contract';
import { Invoice } from '@models/invoice';
import { Message } from '@models/message';
import { Notification, NotificationTags } from '@models/notification';
import { User } from '@models/user';

import * as contract_validation from 'app/shared/validators/contract-validation.json';

interface newTasks {
  newItems: ContractChecklistItem[];
  newActions: ChecklistItemAction[];
}

@Component({
  selector: 'ngx-management-tab',
  templateUrl: './management-tab.component.html',
  styleUrls: ['./management-tab.component.scss'],
})
export class ManagementTabComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();
  @ViewChild('newCommentInput', { static: true }) commentInput!: ElementRef<HTMLInputElement>;
  @ViewChild('form') ngForm: NgForm = {} as NgForm;
  @Input() contract: Contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);

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
  actionsData: TaskModel[] = [];
  checklistItems: ContractChecklistItem[] = [];
  isChecklistEdited = false;

  isPhone = isPhone;
  formatDate = formatDate;
  idToProperty = idToProperty;
  trackByIndex = trackByIndex;

  constructor(
    public userService: UserService,
    private invoiceService: InvoiceService,
    private contractorService: ContractorService,
    private contractService: ContractService,
    private stringUtils: StringUtilService,
    private messageService: MessageService,
    private dialogService: NbDialogService,
    private notificationService: NotificationService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    if (this.contract._id) {
      this.invoice = idToProperty(
        this.contract,
        this.contractService.idToContract.bind(this.contractService),
        'invoice'
      );
      this.avaliableAssignees$.next(this.invoiceService.teamMembers(this.invoice));
      this.userService.currentUser$.pipe(take(1)).subscribe((currentUser) => {
        this.currentUser = currentUser;
      });
      this.isCommentGranted =
        this.invoice.team.findIndex((teamMember) => this.userService.isEqual(teamMember.user, this.currentUser)) != -1;
      (this.managementAssignee = idToProperty(
        this.invoice.author,
        this.userService.idToUser.bind(this.userService),
        'fullName'
      )),
        (this.deadline = this.contractService.deadline(this.contract));
      this.avaliableContracts$ = this.contractService.getContracts();
      this.contractService.edited$.pipe(takeUntil(this.destroy$)).subscribe(() => {
        if (this.contract.invoice)
          this.avaliableAssignees$.next(this.invoiceService.teamMembers(this.contract.invoice));
        this.actionsData = this.transformActionsData();
      });
      this.messageService
        .getMessages()
        .pipe(takeUntil(this.destroy$))
        .subscribe((messages) => {
          this.availableMessages = [];
          messages
            .filter((mFiltered) => this.contractService.isEqual(mFiltered.contract, this.contract))
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

      this.actionsData = this.transformActionsData();
      this.contract.checklist.forEach((item) => (item.locals = {} as ChecklistItemLocals));
      this.checklistItems = cloneDeep(this.contract.checklist);
    }
  }

  ngAfterViewInit() {
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
    });
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
    this.contractService.editContract(this.contract);
    this.sendNotificationsToNewAssignees();
    this.checklistItems = cloneDeep(this.contract.checklist);
    this.isChecklistEdited = false;
    this.ngForm.form.markAsPristine();
    setTimeout(() => {
      this.isFormDirty.next(false);
    }, 10);
  }

  checklistTotalDays(): number | undefined {
    if (this.deadline) {
      //can start be the start date from the initial checklist item?
      return differenceInCalendarDays(this.deadline, this.contract.created);
    }
    return undefined;
  }

  checklistRemainingDays(): number | undefined {
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
    const total = this.checklistTotalDays();
    const remaining = this.checklistRemainingDays();
    if (total != undefined && total != 0 && remaining != undefined) {
      const progress = total - remaining;
      return this.stringUtils.moneyToNumber(this.stringUtils.toPercentageNumber(progress, total).slice(0, -1));
    }
    return 0;
  }

  registerChecklistItem(): void {
    this.newChecklistItem.range = this.newChecklistItem.range as DateRange;
    this.contract.checklist.push(cloneDeep(this.newChecklistItem));
    this.newChecklistItem = new ContractChecklistItem();
    this.newChecklistItem.status = '';
    this.assigneeSearch = '';
    this.deadline = this.contractService.deadline(this.contract);
  }

  totalDays(item: ContractChecklistItem | ChecklistItemAction): number | undefined {
    if (item.range.end) return differenceInCalendarDays(item.range.end, item.range.start);
    return;
  }

  remainingDays(item: ContractChecklistItem | ChecklistItemAction): number | undefined {
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
    if (item.actionList.length == 0) return 0;

    const completedActionsQtd = item.actionList.reduce((count, action) => (action.isFinished ? count + 1 : count), 0);
    return this.stringUtils.moneyToNumber(
      this.stringUtils.toPercentageNumber(completedActionsQtd, item.actionList.length).slice(0, -1)
    );
  }

  hasItemFinished(item: ContractChecklistItem): boolean {
    if (item.actionList.length > 0) {
      const completedActionsQtd = item.actionList.reduce((count, action) => (action.isFinished ? count + 1 : count), 0);
      return completedActionsQtd == item.actionList.length;
    }
    return true;
  }

  percentualActionProgress(action: ChecklistItemAction): number {
    const today = new Date();
    if (isBefore(today, action.range.start) || isSameDay(today, action.range.start)) return 0;
    if ((action.range.end && isAfter(today, action.range.end)) || action.isFinished) return 100;

    return this.stringUtils.moneyToNumber(
      this.stringUtils.toPercentageNumber(this.remainingDays(action), this.totalDays(action)).slice(0, -1)
    );
  }

  itemProgressStatus(item: ContractChecklistItem): string {
    const progress = this.percentualItemProgress(item);
    if (progress == 100) {
      return 'success';
    } else {
      const remainingDays = this.remainingDays(item);
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

  isItemOverdue(item: ContractChecklistItem): boolean {
    const today = new Date();
    if (item.range.end && isAfter(today, item.range.end)) return true;
    return false;
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
        if (!isEqual(this.contract.checklist, this.checklistItems)) this.isChecklistEdited = true;
        this.isDialogBlocked.next(false);
      });
  }

  removeItem(index: number): void {
    this.contract.checklist.splice(index, 1);
    this.isChecklistEdited = true;
  }

  applyManagementModel(selectedContract: Contract): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(ConfirmationDialogComponent, {
        context: {
          question:
            'Você tem certeza que deseja importar a checklist do contrato ' +
            selectedContract.locals.code +
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

  registerNewComment(): void {
    this.newComment.created = new Date();
    this.newComment.author = this.currentUser;
    this.newComment.contract = this.contract;
    const mentionedUsers = this.searchMentionedUsers(this.newComment.body);

    if (mentionedUsers) {
      this.avaliableAssignees$.pipe(take(1)).subscribe((users) => {
        const usersToNotify = this.searchUsersToNotify(users, mentionedUsers);
        if (usersToNotify) {
          this.notificationService.notifyMany(usersToNotify, {
            title: 'Novo comentário na gestão do contrato ' + this.contract.locals.code,
            tag: NotificationTags.MENTION,
            message: this.newComment.body,
          });
        }
      });
    }

    this.newComment.body = this.stringUtils.applyBoldToMention(this.newComment.body);
    this.messageService.saveMessage(this.newComment);
    this.newComment.body = '';
  }

  transformActionsData(): TaskModel[] {
    let groupCount = 0;
    let taskCount = 0;
    const taskData: TaskModel[] = [];

    this.contract.checklist.forEach((item) => {
      groupCount += 1;
      taskCount = 0;

      taskData.push({
        groupName: item.name,
        groupOrder: groupCount,
        taskName: item.name,
        taskId: groupCount.toString() + taskCount.toString(),
        taskDependencies: [],
        start: item.range.start,
        end: item.range.end,
        progressPercentage: this.isItemOverdue(item) ? 100 : this.percentualItemProgress(item),
        owner: idToProperty(item.assignee, this.userService.idToUser.bind(this.userService), 'fullName'),
        image: idToProperty(item.assignee, this.userService.idToUser.bind(this.userService), 'profilePicture'),
        isFinished: this.hasItemFinished(item) ? 1 : 0,
        isAction: 0,
      } as TaskModel);

      item.actionList.forEach((action) => {
        taskCount += 1;

        taskData.push({
          groupName: item.name,
          groupOrder: groupCount,
          taskName: action.name,
          taskId: groupCount.toString() + taskCount.toString(),
          taskDependencies: [taskCount == 1 ? '' : groupCount.toString() + '1'],
          start: action.range.start,
          end: action.range.end,
          progressPercentage: this.percentualActionProgress(action),
          owner: idToProperty(action.assignee, this.userService.idToUser.bind(this.userService), 'fullName'),
          image: idToProperty(action.assignee, this.userService.idToUser.bind(this.userService), 'profilePicture'),
          isFinished: action.isFinished ? 1 : 0,
          isAction: 1,
          finishedDate: action.finishedDate,
        } as TaskModel);
      });
    });

    return taskData;
  }

  /*
    This regex means: look for everything that looks like this: *@foobar*
    So, if body is "Hello There *@Kenobi*" the match is ['*@Kenobi*']
    https://regexr.com/6kt4g
   */
  private searchMentionedUsers(body: string): string[] {
    const matches = body.match(new RegExp(/(\*@).+?\*/g));
    if (!matches) return [];
    return matches.map((match) => match.slice(2, -1));
  }

  private searchUsersToNotify(users: User[], mentionedUsers: string[]): User[] {
    return users.filter((user) => {
      const index = mentionedUsers.findIndex((mentionedUser) => {
        return mentionedUser == (user.exibitionName ? user.exibitionName : user.fullName);
      });

      if (index != -1) {
        mentionedUsers.splice(index, 1);
        return true;
      }

      return false;
    });
  }

  private sendNotificationsToNewAssignees(): void {
    const { newItems, newActions } = this.verifyNewTasks();

    const notifications = [
      ...newItems.map((item) => this.createNotification(item)),
      ...newActions.map((action) => this.createNotification(action)),
    ];

    notifications.forEach((notification) => this.notificationService.notify(notification.to, notification));
  }

  private verifyNewTasks(): newTasks {
    const newItems: ContractChecklistItem[] = [];
    const newActions: ChecklistItemAction[] = [];

    this.contract.checklist.forEach((item) => {
      if (item.locals.isNew) newItems.push(item);
      item.locals.isNew = false;
      item.actionList.forEach((action) => {
        if (action.locals.isNew) {
          action.locals.parentItemName = item.name;
          newActions.push(action);
        }
        action.locals.isNew = false;
      });
    });

    return { newItems, newActions };
  }

  private createNotification(task: ContractChecklistItem | ChecklistItemAction): Notification {
    const notification = new Notification();
    notification.to = task.assignee;
    notification.tag = NotificationTags.APPOINTED_AS_ASSIGNEE;

    if (isOfType(ChecklistItemAction, task)) {
      notification.title = 'Você foi selecionado como responsável de uma nova ação de gestão do contrato!';
      notification.message =
        'No contrato ' +
        this.contract.locals.code +
        ', você foi selecionado como responsável da ação "' +
        task.name +
        '" que faz parte do item "' +
        task.locals.parentItemName +
        '". O prazo inicia em ' +
        formatDate(task.range.start) +
        (task.range.end
          ? ' e termina em ' + formatDate(task.range.end) + '. '
          : ' com data de término a ser definida. ') +
        'Abra a aba de gestão do contrato citado para conferir!';
    } else {
      notification.title = 'Você foi selecionado como responsável de um novo item de gestão do contrato!';
      notification.message =
        'No contrato ' +
        this.contract.locals.code +
        ', você foi selecionado como responsável do item "' +
        task.name +
        '" cujo status é "' +
        task.status +
        '". Abra a aba de gestão do contrato citado para conferir!';
    }

    return notification;
  }
}
