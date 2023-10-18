import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef } from '@nebular/theme';
import { Subject } from 'rxjs';

import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { UserService } from 'app/shared/services/user.service';
import { IdVersionWise, isObjectUpdated, isPhone, tooltipTriggers } from 'app/shared/utils';

import { User } from '@models/user';

@Component({
  selector: 'ngx-user-dialog',
  templateUrl: './user-dialog.component.html',
  styleUrls: ['./user-dialog.component.scss'],
})
export class UserDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() user = new User();
  @Input() isProspect = false;

  objectOutdated$ = new Subject<void>();
  isOutdated: boolean = false;
  isPhone = isPhone;
  tooltipTriggers = tooltipTriggers;
  myObj: IdVersionWise = {
    _id: '0',
    __v: 0,
  };
  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<UserDialogComponent>,
    private userService: UserService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.myObj.__v = this.user.__v;
    this.myObj._id = this.user._id;
    if (this.myObj.__v != undefined) {
      isObjectUpdated(this.userService.getUsers(), this.myObj, this.destroy$, this.objectOutdated$);
      this.objectOutdated$.subscribe(() => {
        this.isOutdated = true;
      });
    }
  }

  handleUserStatusChange(): void {
    setTimeout(() => {
      this.userService.updateUser(this.user);
    }, 10);
    this.updateObjVersion();
  }

  updateObjVersion(): void {
    if (this.myObj.__v !== undefined) {
      this.myObj.__v += 1;
    }
  }
}
