import { Component, OnInit, Input, Inject } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';
import { ContractorDialogComponent } from 'app/pages/contractors/contractor-dialog/contractor-dialog.component';
import { UtilsService } from 'app/shared/services/utils.service';

@Component({
  selector: 'ngx-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss'],
})
export class UserDialogComponent implements OnInit {
  @Input() title: string;
  @Input() user: any;
  @Input() userIndex: number;

  constructor(
    @Inject(NB_DOCUMENT) protected document,
    protected ref: NbDialogRef<ContractorDialogComponent>,
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
