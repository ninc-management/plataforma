import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Contract } from '@models/contract';
import { Invoice } from '@models/invoice';
import { NbDialogService } from '@nebular/theme';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { cloneDeep, isEqual } from 'lodash';
import { BehaviorSubject, take } from 'rxjs';
import { COMPONENT_TYPES, ContractDialogComponent } from '../../contract-dialog/contract-dialog.component';

@Component({
  selector: 'ngx-payment-tab',
  templateUrl: './payment-tab.component.html',
  styleUrls: ['./payment-tab.component.scss'],
})
export class PaymentTabComponent implements OnInit {
  @Input() iContract: Contract = new Contract();
  @Input() contract: Contract = new Contract();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Output() paymentsChanged = new EventEmitter<void>();
  invoice: Invoice = new Invoice();
  isEditionGranted = false;

  types = COMPONENT_TYPES;

  constructor(
    private dialogService: NbDialogService,
    private contractService: ContractService,
    private invoiceService: InvoiceService
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
    const title = index != undefined ? 'ORDEM DE PAGAMENTO' : 'ADICIONAR ORDEM DE PAGAMENTO';

    this.dialogService
      .open(ContractDialogComponent, {
        context: {
          title: title,
          contract: this.contract,
          paymentIndex: componentType == COMPONENT_TYPES.PAYMENT ? index : undefined,
          componentType: componentType,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.paymentsChanged.emit();
        this.isDialogBlocked.next(false);
      });
  }

  confirmationDialog(index: number): void {
    this.isDialogBlocked.next(true);
    const item = 'a ordem de pagamento #' + (index + 1).toString() + '?';

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
          this.contract.payments.splice(index, 1);
          this.paymentsChanged.emit();
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

  isNotEdited(): boolean {
    return isEqual(this.iContract, this.contract);
  }
}
