import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { PlatformConfig } from '@models/platformConfig';
import { UserNotification } from '@models/user';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { NotificationService } from 'app/shared/services/notification.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { isPhone, idToProperty, tooltipTriggers } from 'app/shared/utils';

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
  @Input() notification: UserNotification = new UserNotification();
  @Input() notificationIndex?: number;
  @Input() componentType = COMPONENT_TYPES.CONFIG;
  types = COMPONENT_TYPES;

  isPhone = isPhone;
  idToProperty = idToProperty;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ConfigDialogComponent>,
    public userService: UserService,
    public stringUtils: StringUtilService,
    private notificationService: NotificationService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  dismiss(): void {
    if (
      this.componentType === COMPONENT_TYPES.NOTIFICATION &&
      this.notification.to &&
      this.notificationIndex != undefined
    ) {
      this.notificationService.checkNotification(this.notification);
    }
    super.dismiss();
  }
}
