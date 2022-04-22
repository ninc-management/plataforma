import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { NbDialogService } from '@nebular/theme';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { cloneDeep } from 'lodash';
import { BehaviorSubject, take } from 'rxjs';
import { COMPONENT_TYPES, ContractDialogComponent } from '../../contract-dialog/contract-dialog.component';

@Component({
  selector: 'ngx-receipt-tab',
  templateUrl: './receipt-tab.component.html',
  styleUrls: ['./receipt-tab.component.scss'],
})
export class ReceiptTabComponent implements OnInit {
  @Input() iContract: Contract = new Contract();
  @Input() contract: Contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Output() response = new EventEmitter<void>();
  invoice: Invoice = new Invoice();
  isEditionGranted = false;
  types = COMPONENT_TYPES;

  constructor(
    private contractService: ContractService,
    private invoiceService: InvoiceService,
    public utils: UtilsService,
    public stringUtil: StringUtilService,
    private dialogService: NbDialogService
  ) {}

  ngOnInit(): void {
    if (this.contract.invoice) this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    this.contractService
      .checkEditPermission(this.invoice)
      .pipe(take(1))
      .subscribe((isGranted) => {
        this.isEditionGranted = isGranted;
      });
  }

  openDialog(componentType: COMPONENT_TYPES, index?: number): void {
    this.isDialogBlocked.next(true);
    index = index != undefined ? index : undefined;
    const title = index != undefined ? 'ORDEM DE EMPENHO' : 'ADICIONAR ORDEM DE EMPENHO';

    this.dialogService
      .open(ContractDialogComponent, {
        context: {
          title: title,
          contract: this.contract,
          receiptIndex: componentType == COMPONENT_TYPES.RECEIPT ? index : undefined,
          componentType: componentType,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.response.emit();
        this.isDialogBlocked.next(false);
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
          this.contract.receipts.splice(index, 1);
          this.response.emit();
          this.updateContract();
        }
        this.isDialogBlocked.next(false);
      });
  }

  updateContract(): void {
    let version = +this.contract.version;
    version += 1;
    this.contract.version = version.toString().padStart(2, '0');
    this.contract.lastUpdate = new Date();
    if (this.iContract.status !== this.contract.status) {
      const lastStatusIndex = this.contract.statusHistory.length - 1;
      this.contract.statusHistory[lastStatusIndex].end = this.contract.lastUpdate;
      this.contract.statusHistory.push({
        status: this.contract.status,
        start: this.contract.lastUpdate,
      });
    }
    this.iContract = cloneDeep(this.contract);
    this.invoiceService.editInvoice(this.invoice);
    this.contractService.editContract(this.iContract);
  }
}
