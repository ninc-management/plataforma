import { Component, OnInit, Input, Inject, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { User } from '@models/user';
import { UserService } from 'app/shared/services/user.service';
import { isPhone, tooltipTriggers } from 'app/shared/utils';

@Component({
  selector: 'ngx-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss'],
})
export class UserDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() user = new User();
  @Input() isProspect = false;

  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<UserDialogComponent>,
    private userService: UserService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  handleUserStatusChange(): void {
    setTimeout(() => {
      this.userService.updateUser(this.user);
    }, 10);
  }
}
