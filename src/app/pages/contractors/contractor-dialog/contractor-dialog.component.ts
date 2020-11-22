import { Component, OnInit, Inject, Input } from '@angular/core';
import {
  NB_DOCUMENT,
  NbDialogRef,
  NbMediaBreakpointsService,
} from '@nebular/theme';

@Component({
  selector: 'ngx-contractor-dialog',
  templateUrl: './contractor-dialog.component.html',
  styleUrls: ['./contractor-dialog.component.scss'],
})
export class ContractorDialogComponent implements OnInit {
  @Input() title: string;
  @Input() contractor: any;
  @Input() contractorIndex: number;

  constructor(
    @Inject(NB_DOCUMENT) protected document,
    protected ref: NbDialogRef<ContractorDialogComponent>,
    private breakpointService: NbMediaBreakpointsService
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
    this.ref.close();
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
