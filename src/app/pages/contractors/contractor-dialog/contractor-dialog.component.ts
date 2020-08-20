import { Component, OnInit, Inject, Input } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-contractor-dialog',
  templateUrl: './contractor-dialog.component.html',
  styleUrls: ['./contractor-dialog.component.scss'],
})
export class ContractorDialogComponent implements OnInit {
  @Input() title: string;
  @Input() contractor: any;

  constructor(
    @Inject(NB_DOCUMENT) protected document,
    protected ref: NbDialogRef<ContractorDialogComponent>
  ) {}

  ngOnInit(): void {}

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
