import { Component, Inject, Input, OnInit, Optional, ViewChild } from '@angular/core';
import { ChecklistItemAction, Contract, ContractChecklistItem, DateRange } from '@models/contract';
import { Invoice } from '@models/invoice';
import { User } from '@models/user';
import { NbDialogRef, NbDialogService, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { AVALIABLE_MANAGEMENT_ITEM_STATUS } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, take } from 'rxjs';
import { idToProperty, formatDate } from 'app/shared/utils';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'ngx-checklist-item-dialog',
  templateUrl: './checklist-item-dialog.component.html',
  styleUrls: ['./checklist-item-dialog.component.scss'],
})
export class ChecklistItemDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() itemIndex?: number;
  @ViewChild('form') ngForm: NgForm = {} as NgForm;
  invoice: Invoice = new Invoice();
  checklistItem: ContractChecklistItem = new ContractChecklistItem();
  actionList!: ChecklistItemAction[];
  newAction: ChecklistItemAction = new ChecklistItemAction();
  assigneeSearch = '';
  avaliableAssignees$ = new BehaviorSubject<User[]>([]);
  avaliableActionStatus = Object.values(AVALIABLE_MANAGEMENT_ITEM_STATUS);
  isChecklistEdited = false;

  idToProperty = idToProperty;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ChecklistItemDialogComponent>,
    private invoiceService: InvoiceService,
    private dialogService: NbDialogService,
    public userService: UserService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    if (this.contract.invoice) {
      this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      this.avaliableAssignees$.next(this.invoiceService.teamMembers(this.contract.invoice));
    }
    if (this.itemIndex !== undefined) {
      this.checklistItem = cloneDeep(this.contract.checklist[this.itemIndex]);
      this.actionList = cloneDeep(this.checklistItem.actionList);
    }
  }

  ngAfterViewInit() {
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
    });
  }

  dismiss(): void {
    if (this.isFormDirty.value) {
      this.dialogService
        .open(ConfirmationDialogComponent, {
          context: {
            question: 'Deseja descartar as alterações feitas?',
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        })
        .onClose.pipe(take(1))
        .subscribe((response: boolean) => {
          if (response) {
            super.dismiss();
          }
        });
    } else {
      super.dismiss();
    }
  }

  registerAction(): void {
    if (this.itemIndex !== undefined) {
      this.newAction.range = this.newAction.range as DateRange;
      this.actionList.push(cloneDeep(this.newAction));
      this.newAction = new ChecklistItemAction();
      this.assigneeSearch = '';
    }
  }

  removeAction(index: number): void {
    this.actionList.splice(index, 1);
    this.isChecklistEdited = true;
  }

  updateAction(): void {
    if (this.itemIndex !== undefined) {
      this.checklistItem.actionList = cloneDeep(this.actionList);
      this.contract.checklist[this.itemIndex] = cloneDeep(this.checklistItem);
      setTimeout(() => {
        this.isFormDirty.next(false);
        this.dismiss();
      }, 10);
    }
  }

  formattedRange(range: DateRange): string | undefined {
    if (range.end) {
      return formatDate(range.start) + ' - ' + formatDate(range.end);
    }
    return formatDate(range.start);
  }

  checkAction(index: number): void {
    this.actionList[index].finishedDate = new Date();
  }
}
