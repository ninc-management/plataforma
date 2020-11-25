import { Component, OnInit, Input, Inject } from '@angular/core';
import {
  NbDialogRef,
  NbMediaBreakpointsService,
  NB_DOCUMENT,
} from '@nebular/theme';
import { DepartmentService } from '../../../shared/services/department.service';
import { fromEvent } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { PdfService } from '../pdf.service';

@Component({
  selector: 'ngx-invoice-dialog',
  templateUrl: './invoice-dialog.component.html',
  styleUrls: ['./invoice-dialog.component.scss'],
})
export class InvoiceDialogComponent implements OnInit {
  @Input() title: string;
  @Input() invoice: any;

  constructor(
    @Inject(NB_DOCUMENT) protected document,
    protected ref: NbDialogRef<InvoiceDialogComponent>,
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
    if (this.invoice)
      if (this.invoice.department.length > 3)
        this.invoice.department = this.departmentService.extractAbreviation(
          this.invoice.department
        );
    let oInvoice = Object.assign({}, this.invoice);
    oInvoice.code = '';
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
