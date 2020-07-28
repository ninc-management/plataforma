import { Component, OnInit, Input, Inject } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { DepartmentService } from '../../../shared/services/department.service';
import { fromEvent } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'ngx-contract-dialog',
  templateUrl: './contract-dialog.component.html',
  styleUrls: ['./contract-dialog.component.scss'],
})
export class ContractDialogComponent implements OnInit {
  @Input() title: string;
  @Input() contract: any;

  constructor(
    @Inject(NB_DOCUMENT) protected document,
    protected ref: NbDialogRef<ContractDialogComponent>,
    protected departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    fromEvent(this.document, 'keyup')
      .pipe(
        filter((event: KeyboardEvent) => event.keyCode === 27),
        takeUntil(this.ref.onClose)
      )
      .subscribe(() => this.dismiss());
  }

  dismiss(): void {
    this.ref.close();
  }

  windowWidth(): number {
    return window.innerWidth;
  }

  windowHeight(): number {
    return window.innerHeight * 0.95;
  }
}
