import { Component, OnInit, Input, Inject } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { DepartmentService } from '../../../shared/services/department.service';
import { OnedriveService } from 'app/shared/services/onedrive.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { fromEvent } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

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
export class ContractDialogComponent implements OnInit {
  @Input() title: string;
  @Input() contract: any;
  @Input() contractIndex: number;
  @Input() paymentIndex: number;
  @Input() receiptIndex: number;
  @Input() expenseIndex: number;
  @Input() componentType: ComponentTypes;
  isPayable = true;
  types = ComponentTypes;
  onedriveUrl: string;

  constructor(
    @Inject(NB_DOCUMENT) protected document,
    protected ref: NbDialogRef<ContractDialogComponent>,
    protected departmentService: DepartmentService,
    private onedrive: OnedriveService,
    public utils: UtilsService
  ) {}

  ngOnInit(): void {
    // TODO: Pensar num tratamento melhor para dialogos aninhados, ao invés de fechar os 2
    // fromEvent(this.document, 'keyup')
    //   .pipe(
    //     filter((event: KeyboardEvent) => event.keyCode === 27),
    //     takeUntil(this.ref.onClose)
    //   )
    //   .subscribe(() => this.dismiss());
    this.isPayable = this.contract.receipts.length < this.contract.total;
    if (this.componentType == ComponentTypes.CONTRACT)
      this.onedrive
        .webUrl(this.contract)
        .subscribe((url) => (this.onedriveUrl = url));
  }

  dismiss(): void {
    this.ref.close();
  }

  windowWidth(): number {
    return window.innerWidth;
  }

  windowHeight(): number {
    return window.innerHeight * 0.99;
  }
}
