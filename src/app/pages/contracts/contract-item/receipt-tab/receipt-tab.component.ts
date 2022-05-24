import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { NbDialogService } from '@nebular/theme';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, take } from 'rxjs';
import { COMPONENT_TYPES, ContractDialogComponent } from '../../contract-dialog/contract-dialog.component';

@Component({
  selector: 'ngx-receipt-tab',
  templateUrl: './receipt-tab.component.html',
  styleUrls: ['./receipt-tab.component.scss'],
})
export class ReceiptTabComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() clonedContract: Contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Output() receiptsChanged = new EventEmitter<void>();
  invoice: Invoice = new Invoice();
  isEditionGranted = false;

  constructor(
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    public stringUtil: StringUtilService,
    private dialogService: NbDialogService
  ) {}

  ngOnInit(): void {
    if (this.clonedContract.invoice) this.invoice = this.invoiceService.idToInvoice(this.clonedContract.invoice);
    this.contractService
      .checkEditPermission(this.invoice)
      .pipe(take(1))
      .subscribe((isGranted) => {
        this.isEditionGranted = isGranted;
      });
  }

  openDialog(index?: number): void {
    this.isDialogBlocked.next(true);
    index = index != undefined ? index : undefined;
    const title = index != undefined ? 'ORDEM DE EMPENHO' : 'ADICIONAR ORDEM DE EMPENHO';

    this.dialogService
      .open(ContractDialogComponent, {
        context: {
          title: title,
          contract: this.clonedContract,
          receiptIndex: index,
          componentType: COMPONENT_TYPES.RECEIPT,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.receiptsChanged.emit();
        this.isDialogBlocked.next(false);
        this.clonedContract.balance = this.contractService.balance(this.clonedContract);
      });
  }

  confirmationDialog(index: number): void {
    this.isDialogBlocked.next(true);
    const item = 'a ordem de empenho #' + (index + 1).toString() + '?';

    this.dialogService
      .open(ConfirmationDialogComponent, {
        context: {
          question: 'Realmente deseja excluir ' + item,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((response) => {
        if (response) {
          this.clonedContract.receipts.splice(index, 1);
          this.receiptsChanged.emit();
          this.clonedContract.balance = this.contractService.balance(this.clonedContract);
          this.updateContract();
        }
        this.isDialogBlocked.next(false);
      });
  }

  updateContract(): void {
    let version = +this.clonedContract.version;
    version += 1;
    this.clonedContract.version = version.toString().padStart(2, '0');
    this.clonedContract.lastUpdate = new Date();
    if (this.contract.status !== this.clonedContract.status) {
      const lastStatusIndex = this.clonedContract.statusHistory.length - 1;
      this.clonedContract.statusHistory[lastStatusIndex].end = this.clonedContract.lastUpdate;
      this.clonedContract.statusHistory.push({
        status: this.clonedContract.status,
        start: this.clonedContract.lastUpdate,
      });
    }
    this.contract = cloneDeep(this.clonedContract);
    this.invoiceService.editInvoice(this.invoice);
    this.contractService.editContract(this.contract);
  }
}
