import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef, NbDialogService } from '@nebular/theme';
import { take } from 'rxjs';

import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { TeamService } from 'app/shared/services/team.service';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

import { Team } from '@models/team';

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

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<TeamDialogComponent>,
    private dialogService: NbDialogService,
    public teamService: TeamService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  dismiss(): void {
    if (this.isFormDirty.value) {
      this.dialogService
        .open(ConfirmationDialogComponent, {
          context: {
            question: 'Deseja descartar as alterações feitas?',
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        })
        .onClose.pipe(take(1))
        .subscribe((response: boolean) => {
          if (response) {
            super.dismiss();
          }
        });
    } else {
      super.dismiss();
    }
  }

  handleTeamStatusChange(): void {
    setTimeout(() => {
      this.teamService.editTeam(this.iTeam);
    }, 10);
  }
}
