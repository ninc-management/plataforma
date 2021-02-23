import { Component, OnInit, Input, Inject } from '@angular/core';
import {
  NbDialogRef,
  NbMediaBreakpointsService,
  NB_DOCUMENT,
  NbDialogService,
} from '@nebular/theme';
import { DepartmentService } from '../../../shared/services/department.service';
import { PdfService } from '../pdf.service';
import { PdfDialogComponent } from 'app/shared/components/pdf-dialog/pdf-dialog.component';
import * as _ from 'lodash';

@Component({
  selector: 'ngx-invoice-dialog',
  templateUrl: './invoice-dialog.component.html',
  styleUrls: ['./invoice-dialog.component.scss'],
})
export class InvoiceDialogComponent implements OnInit {
  @Input() title: string;
  @Input() invoice: any;
  tempInvoice: any;

  constructor(
    @Inject(NB_DOCUMENT) protected document,
    protected ref: NbDialogRef<InvoiceDialogComponent>,
    private dialogService: NbDialogService,
    protected departmentService: DepartmentService,
    private breakpointService: NbMediaBreakpointsService,
    private pdf: PdfService
  ) {}

  ngOnInit(): void {
    // TODO: Pensar num tratamento melhor para dialogos aninhados, ao invés de fechar os 2
    // fromEvent(this.document, 'keyup')
    //   .pipe(
    //     filter((event: KeyboardEvent) => event.keyCode === 27),
    //     takeUntil(this.ref.onClose)
    //   )
    //   .subscribe(() => this.dismiss());
    if (this.invoice) this.tempInvoice = _.cloneDeep(this.invoice);
  }

  dismiss(): void {
    if (this.invoice)
      if (this.invoice.department.length > 3)
        this.invoice.department = this.departmentService.extractAbreviation(
          this.invoice.department
        );
    this.ref.close();
  }

  useAsModel(): void {
    let oInvoice = _.cloneDeep(this.invoice);
    if (oInvoice.department.length > 3)
      oInvoice.department = this.departmentService.extractAbreviation(
        oInvoice.department
      );
    oInvoice.code = '';
    if (oInvoice.products.length > 0)
      oInvoice.products.map((product) => {
        product.amount = product.amount ? product.amount : '1';
        product.total = product.total ? product.total : product.value;
        return product;
      });
    if (oInvoice.materials.length > 0)
      oInvoice.materials.map((material) => {
        material.value = material.value ? material.value : '0,00';
        material.total = material.total ? material.total : '0,00';
        return material;
      });
    delete oInvoice._id;
    delete oInvoice.author;
    delete oInvoice.created;
    delete oInvoice.lastUpdate;
    delete oInvoice.status;
    oInvoice.model = true;
    this.ref.close(oInvoice);
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

  isPhone(): boolean {
    const { md } = this.breakpointService.getBreakpointsMap();
    return document.documentElement.clientWidth <= md;
  }

  windowWidth(): number {
    return window.innerWidth;
  }

  windowHeight(): number {
    return window.innerHeight * 0.99;
  }
}
