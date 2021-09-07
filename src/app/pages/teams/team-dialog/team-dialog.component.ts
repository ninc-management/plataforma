import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { UtilsService } from 'app/shared/services/utils.service';
import { Team } from '@models/team';

@Component({
  selector: 'ngx-team-dialog',
  templateUrl: './team-dialog.component.html',
  styleUrls: ['./team-dialog.component.scss'],
})
export class TeamDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() team = new Team();

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<TeamDialogComponent>,
    public utils: UtilsService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }
}
