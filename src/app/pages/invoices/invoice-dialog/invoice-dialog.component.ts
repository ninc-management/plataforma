import { Component, OnInit, Input, Inject, Optional } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT, NbDialogService } from '@nebular/theme';
import { DepartmentService } from 'app/shared/services/department.service';
import { UserService } from 'app/shared/services/user.service';
import { PdfService } from '../pdf.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { PdfDialogComponent } from 'app/shared/components/pdf-dialog/pdf-dialog.component';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { take } from 'rxjs/operators';
import { cloneDeep } from 'lodash';
import { INVOICE_STATOOS } from 'app/shared/services/invoice.service';
import { Invoice, InvoiceProduct, InvoiceMaterial } from '@models/invoice';
import { User } from '@models/user';

@Component({
  selector: 'ngx-invoice-dialog',
  templateUrl: './invoice-dialog.component.html',
  styleUrls: ['./invoice-dialog.component.scss'],
})
export class InvoiceDialogComponent
  extends BaseDialogComponent
  implements OnInit
{
  @Input() title = '';
  @Input() invoice = new Invoice();
  tempInvoice: Invoice = new Invoice();

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<InvoiceDialogComponent>,
    private dialogService: NbDialogService,
    protected departmentService: DepartmentService,
    private userService: UserService,
    private pdf: PdfService,
    public utils: UtilsService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    if (this.invoice) this.tempInvoice = cloneDeep(this.invoice);
    else this.invoice = new Invoice();
  }

  dismiss(): void {
    super.dismiss();
  }

  useAsModel(): void {
    const oInvoice = cloneDeep(this.invoice);
    if (oInvoice.department.length > 3)
      oInvoice.department = this.departmentService.extractAbreviation(
        oInvoice.department
      );
    oInvoice.code = '';
    if (oInvoice.products.length > 0)
      oInvoice.products.map((product: InvoiceProduct) => {
        product.amount = product.amount ? product.amount : '1';
        product.total = product.total ? product.total : product.value;
        return product;
      });
    if (oInvoice.materials.length > 0)
      oInvoice.materials.map((material: InvoiceMaterial) => {
        material.value = material.value ? material.value : '0,00';
        material.total = material.total ? material.total : '0,00';
        return material;
      });
    this.userService.currentUser$.pipe(take(1)).subscribe((user: User) => {
      oInvoice.author = user;
    });
    delete (oInvoice as any)._id;
    oInvoice.created = new Date();
    oInvoice.lastUpdate = new Date();
    oInvoice.status = INVOICE_STATOOS.EM_ANALISE;
    oInvoice.model = true;
    this.derivedRef.close(oInvoice);
  }

  generatePDF(): void {
    this.pdf.generate(this.invoice);
  }

  previewPDF(): void {
    this.pdf.generate(this.tempInvoice, true);

    this.dialogService.open(PdfDialogComponent, {
      context: {
        dataUrl$: this.pdf.pdfData$,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
