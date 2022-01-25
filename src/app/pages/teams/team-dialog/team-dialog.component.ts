import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { UtilsService } from 'app/shared/services/utils.service';
import { Team, TeamExpense } from '@models/team';

export enum TEAM_COMPONENT_TYPES {
  TEAM,
  EXPENSES,
  EXPENSE,
  TRANSFER,
}

@Component({
  selector: 'ngx-team-dialog',
  templateUrl: './team-dialog.component.html',
  styleUrls: ['./team-dialog.component.scss'],
})
export class TeamDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() iTeam = new Team();
  @Input() expenseIdx?: number;
  @Input() componentType = TEAM_COMPONENT_TYPES.TEAM;

  dTypes = TEAM_COMPONENT_TYPES;

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

  dismiss(): void {
    super.dismiss();
  }
}
