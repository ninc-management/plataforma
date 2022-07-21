import { transition, trigger, useAnimation } from '@angular/animations';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  NbDialogService,
  NbMediaBreakpointsService,
  NbMenuService,
  NbSidebarService,
  NbThemeService,
} from '@nebular/theme';
import { environment } from 'app/../environments/environment';
import { combineLatest, Subject } from 'rxjs';
import { filter, map, skipWhile, takeUntil } from 'rxjs/operators';

import { tada } from './animation';
import {
  COMPONENT_TYPES,
  ConfigDialogComponent,
} from 'app/@theme/components/header/config/config-dialog/config-dialog.component';
import { ConfigService } from 'app/shared/services/config.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { elapsedTime, idToProperty, isPhone, trackByIndex } from 'app/shared/utils';

import { Notification, NotificationTags } from '@models/notification';
import { PlatformConfig } from '@models/platformConfig';
import { User } from '@models/user';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
  animations: [trigger('shake', [transition('inactive => active', useAnimation(tada))])],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('widget', { static: false, read: ElementRef }) iframeRef!: ElementRef<HTMLElement>;
  private destroy$: Subject<void> = new Subject<void>();
  env = environment;
  user = new User();
  config: PlatformConfig = new PlatformConfig();
  menuButtonClicked = false;
  userPictureOnly = false;
  menuTitle = '';
  logoIcon = 'companyLogo';
  state = 'inactive';
  currentNotificationsQtd = 0;

  isPhone = isPhone;
  trackByIndex = trackByIndex;
  elapsedTime = elapsedTime;
  idToProperty = idToProperty;

  public constructor(
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private breakpointService: NbMediaBreakpointsService,
    private dialogService: NbDialogService,
    private configService: ConfigService,
    public userService: UserService,
    public stringUtils: StringUtilService
  ) {}

  ngOnInit(): void {
    const multipleBellRing = new Audio('/assets/audios/multipleBellRing.mp3');
    const singleBellRing = new Audio('/assets/audios/singleBellRing.mp3');

    combineLatest([this.userService.currentUser$, this.configService.isDataLoaded$, this.configService.getConfig()])
      .pipe(
        skipWhile(([, configLoaded, _]) => !configLoaded),
        takeUntil(this.destroy$),
        filter(([currentUser, ,]) => currentUser._id !== undefined)
      )
      .subscribe(([currentUser, , config]) => {
        this.user = currentUser;
        this.currentNotificationsQtd = currentUser.notifications.length;
        this.changeTheme();
        this.config = config[0];
        this.menuTitle = config[0].socialConfig.companyName;
      });

    combineLatest([this.userService.getUsers(), this.userService.isDataLoaded$])
      .pipe(
        skipWhile(([_, isUserDataLoaded]) => !isUserDataLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([users, _]) => {
        const matchedUser = users.find((currentUser) => this.userService.isEqual(currentUser._id, this.user._id));
        if (matchedUser) {
          if (this.currentNotificationsQtd < matchedUser.notifications.length) {
            const lastNotification = matchedUser.notifications[matchedUser.notifications.length - 1];
            if (lastNotification.tag == NotificationTags.CONTRACT_SIGNED) multipleBellRing.play();
            else singleBellRing.play();

            this.state = 'active';
          }
          this.user = matchedUser;
          this.currentNotificationsQtd = matchedUser.notifications.length;
        }
      });

    const { sm, xl } = this.breakpointService.getBreakpointsMap();
    this.themeService
      .onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$)
      )
      .subscribe((isLessThanXl: boolean) => (this.userPictureOnly = isLessThanXl));

    this.menuService
      .onItemSelect()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: { tag: string; item: any }) => {
        if (document.documentElement.clientWidth <= sm && event.tag === 'main') {
          this.menuTitle = event.item.title === 'Início' ? this.config.socialConfig.companyName : event.item.title;
        }
      });

    this.menuService
      .onItemClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event.tag == 'config') {
          this.dialogService.open(ConfigDialogComponent, {
            context: {
              title: 'CONFIGURAÇÕES DA PLATAFORMA',
              config: this.config,
            },
            dialogClass: 'my-dialog',
            closeOnBackdropClick: false,
            closeOnEsc: false,
            autoFocus: false,
          });
        }
      });

    this.sidebarService
      .onToggle()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.menuButtonClicked = !this.menuButtonClicked));

    this.sidebarService
      .onCompact()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => (this.menuButtonClicked = false));

    this.themeService
      .onThemeChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe((theme) => {
        this.logoIcon = ['dark', 'cosmic'].includes(theme.name) ? 'companyLogoWhite' : 'companyLogo';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  displayIframe(): void {
    this.iframeRef.nativeElement.classList.toggle('active');
  }

  onDone(event: any): void {
    this.state = 'inactive';
  }

  changeTheme(): void {
    this.themeService.changeTheme(this.user.theme == undefined ? 'default' : this.user.theme);
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');

    return false;
  }

  navigateHome(): boolean {
    this.menuService.navigateHome();
    return false;
  }

  openNotification(idx: number, notification: Notification): void {
    this.dialogService.open(ConfigDialogComponent, {
      context: {
        title: notification.title,
        notification: notification,
        notificationIndex: idx,
        componentType: COMPONENT_TYPES.NOTIFICATION,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
