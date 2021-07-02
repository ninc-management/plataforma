import { Component, OnInit, Input, Inject, Optional } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { DepartmentService } from 'app//shared/services/department.service';
import { OnedriveService } from 'app/shared/services/onedrive.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { take } from 'rxjs/operators';
import { PdfService } from 'app/pages/invoices/pdf.service';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { Contract } from '../../../../../backend/src/models/contract';
import { cloneDeep } from 'lodash';

export enum ComponentTypes {
  CONTRACT,
  PAYMENT,
  RECEIPT,
  EXPENSE,
}

@Component({
  selector: 'ngx-contract-dialog',
  templateUrl: './contract-dialog.component.html',
  styleUrls: ['./contract-dialog.component.scss'],
})
export class ContractDialogComponent
  extends BaseDialogComponent
  implements OnInit
{
  @Input() title = '';
  @Input() contract = new Contract();
  @Input() contractIndex?: number;
  @Input() paymentIndex?: number;
  @Input() receiptIndex?: number;
  @Input() expenseIndex?: number;
  @Input() componentType = ComponentTypes.RECEIPT;
  isPayable = true;
  hasBalance = true;
  types = ComponentTypes;
  onedriveUrl = '';

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ContractDialogComponent>,
    protected departmentService: DepartmentService,
    protected invoiceService: InvoiceService,
    private stringUtil: StringUtilService,
    private onedrive: OnedriveService,
    private pdf: PdfService,
    public utils: UtilsService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.isPayable =
      this.contract.total != undefined &&
      this.contract.receipts.length < +this.contract.total;
    this.hasBalance = this.stringUtil.moneyToNumber(this.contract.balance) > 0;
    if (this.componentType == ComponentTypes.CONTRACT) this.getOnedriveUrl();
  }

  dismiss(): void {
    super.dismiss();
  }

  getOnedriveUrl(): void {
    if (this.contract.invoice) {
      const contract = cloneDeep(this.contract);
      contract.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      this.onedrive.webUrl(contract).subscribe(
        (url) => {
          this.onedriveUrl = url;
        },
        (error) => {
          this.onedriveUrl = '';
        }
      );
    }
  }

  addToOnedrive(): void {
    if (this.contract.invoice)
      this.onedrive
        .copyModelFolder(this.invoiceService.idToInvoice(this.contract.invoice))
        .pipe(take(1))
        .subscribe((isComplete) => {
          if (isComplete)
            setTimeout(() => {
              this.getOnedriveUrl();
            }, 4000); // Tempo para a cópia da pasta ser realizada
        });
  }
  openPDFnewtab(): void {
    if (this.contract.invoice)
      this.pdf.generate(
        this.invoiceService.idToInvoice(this.contract.invoice),
        false,
        true
      );
  }
  windowWidth(): number {
    return window.innerWidth;
  }

  windowHeight(): number {
    return window.innerHeight * 0.99;
  }
}
