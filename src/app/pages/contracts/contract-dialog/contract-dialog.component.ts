import { Component, OnInit, Input, Inject } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { DepartmentService } from '../../../shared/services/department.service';
import { OnedriveService } from 'app/shared/services/onedrive.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { take } from 'rxjs/operators';
import { PdfService } from 'app/pages/invoices/pdf.service';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';

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
  @Input() title: string;
  @Input() contract: any;
  @Input() contractIndex: number;
  @Input() paymentIndex: number;
  @Input() receiptIndex: number;
  @Input() expenseIndex: number;
  @Input() componentType: ComponentTypes;
  isPayable = true;
  hasBalance = true;
  types = ComponentTypes;
  onedriveUrl: string;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    protected derivedRef: NbDialogRef<ContractDialogComponent>,
    protected departmentService: DepartmentService,
    private stringUtil: StringUtilService,
    private onedrive: OnedriveService,
    private pdf: PdfService,
    public utils: UtilsService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.isPayable = this.contract.receipts.length < this.contract.total;
    this.hasBalance = this.stringUtil.moneyToNumber(this.contract.balance) > 0;
    if (this.componentType == ComponentTypes.CONTRACT) this.getOnedriveUrl();
  }

  dismiss(): void {
    super.dismiss();
  }

  getOnedriveUrl(): void {
    this.onedrive.webUrl(this.contract).subscribe(
      (url) => {
        this.onedriveUrl = url;
      },
      (error) => {
        this.onedriveUrl = '';
      }
    );
  }

  addToOnedrive(): void {
    this.onedrive
      .copyModelFolder(this.contract.invoice)
      .pipe(take(1))
      .subscribe((isComplete) => {
        if (isComplete)
          setTimeout(() => {
            this.getOnedriveUrl();
          }, 4000); // Tempo para a cópia da pasta ser realizada
      });
  }
  openPDFnewtab(): void {
    this.pdf.generate(this.contract.invoice, false, true);
  }
  windowWidth(): number {
    return window.innerWidth;
  }

  windowHeight(): number {
    return window.innerHeight * 0.99;
  }
}
