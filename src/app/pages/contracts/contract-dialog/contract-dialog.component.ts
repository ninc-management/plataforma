import { Component, OnInit, Input } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { DepartmentService } from '../../../shared/services/department.service';

@Component({
  selector: 'ngx-contract-dialog',
  templateUrl: './contract-dialog.component.html',
  styleUrls: ['./contract-dialog.component.scss'],
})
export class ContractDialogComponent implements OnInit {
  @Input() title: string;
  @Input() contract: any;

  constructor(
    protected ref: NbDialogRef<ContractDialogComponent>,
    protected departmentService: DepartmentService
  ) {}

  ngOnInit(): void {}

  dismiss(): void {
    if (this.contract)
      if (this.contract.department.length > 3)
        this.contract.department = this.departmentService.extractAbreviation(
          this.contract.department
        );
    this.ref.close();
  }

  windowWidth(): number {
    return window.innerWidth;
  }
}
