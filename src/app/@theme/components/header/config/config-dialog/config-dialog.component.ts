import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef, NbDialogService } from '@nebular/theme';
import { take } from 'rxjs';

import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { NotificationService } from 'app/shared/services/notification.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { idToProperty, isPhone, tooltipTriggers } from 'app/shared/utils';

import { Notification } from '@models/notification';
import { PlatformConfig } from '@models/platformConfig';

export enum COMPONENT_TYPES {
  CONFIG,
  NOTIFICATION,
}

@Component({
  selector: 'ngx-config-dialog',
  templateUrl: './config-dialog.component.html',
  styleUrls: ['./config-dialog.component.scss'],
})
export class ConfigDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() config: PlatformConfig = new PlatformConfig();
  @Input() notification: Notification = new Notification();
  @Input() notificationIndex?: number;
  @Input() componentType = COMPONENT_TYPES.CONFIG;
  types = COMPONENT_TYPES;

  isPhone = isPhone;
  idToProperty = idToProperty;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ConfigDialogComponent>,
    private notificationService: NotificationService,
    private dialogService: NbDialogService,
    public userService: UserService,
    public stringUtils: StringUtilService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  markAsRead() {
    if (
      this.componentType === COMPONENT_TYPES.NOTIFICATION &&
      this.notification.to &&
      this.notificationIndex != undefined
    ) {
      this.notificationService.checkNotification(this.notification);
    }
    super.dismiss();
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
    } else super.dismiss();
  }
}
