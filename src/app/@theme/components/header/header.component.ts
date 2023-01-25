import { transition, trigger, useAnimation } from '@angular/animations';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NbAccessChecker } from '@nebular/security';
import {
  NbDialogService,
  NbMediaBreakpointsService,
  NbMenuService,
  NbPopoverDirective,
  NbSidebarService,
  NbThemeService,
} from '@nebular/theme';
import { environment } from 'app/../environments/environment';
import { combineLatest, Subject } from 'rxjs';
import { filter, map, skipWhile, take, takeUntil } from 'rxjs/operators';

import { tada } from './animation';
import {
  COMPONENT_TYPES,
  ConfigDialogComponent,
} from 'app/@theme/components/header/config/config-dialog/config-dialog.component';
import { CompanyService } from 'app/shared/services/company.service';
import { ConfigService } from 'app/shared/services/config.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { elapsedTime, idToProperty, isPhone, Permissions, sortNotifications, trackByIndex } from 'app/shared/utils';

import { Company } from '@models/company';
import { Notification, NotificationTags } from '@models/notification';
import { PlatformConfig } from '@models/platformConfig';
import { UploadedFile } from '@models/shared/uploadedFiles';
import { User } from '@models/user';

interface NbMenuItem {
  title: string;
  link?: string;
  tag?: string;
}

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
  animations: [trigger('shake', [transition('inactive => active', useAnimation(tada))])],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild(NbPopoverDirective) popover!: NbPopoverDirective;
  private destroy$: Subject<void> = new Subject<void>();
  env = environment;
  menuButtonClicked = false;
  menuTitle = '';
  userPictureOnly = false;
  user = new User();
  logoIcon = 'companyLogo';
  currentNotificationsQtd = 0;
  state = 'inactive';
  config: PlatformConfig = new PlatformConfig();
  company: Company = new Company();
  logoWhite: UploadedFile = new UploadedFile();
  userMenu: NbMenuItem[] = [
    { title: 'Perfil', link: 'pages/profile' },
    { title: 'Sair', link: '/auth/logout' },
  ];

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
    private accessChecker: NbAccessChecker,
    private configService: ConfigService,
    public userService: UserService,
    public stringUtils: StringUtilService,
    public companyService: CompanyService
  ) {}

  ngOnInit(): void {
    const multipleBellRing = new Audio('/assets/audios/multipleBellRing.mp3');
    const singleBellRing = new Audio('/assets/audios/singleBellRing.mp3');
    combineLatest([
      this.userService.currentUser$,
      this.configService.getConfig(),
      this.companyService.getCompanies(),
      this.configService.isDataLoaded$,
      this.companyService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(([, , , configLoaded, configCompanyLoaded]) => !(configLoaded && configCompanyLoaded)),
        takeUntil(this.destroy$),
        filter(([currentUser, , , ,]) => currentUser._id !== undefined)
      )
      .subscribe(([currentUser, config, , ,]) => {
        this.user = currentUser;
        this.user.notifications.sort(sortNotifications);
        this.currentNotificationsQtd = currentUser.notifications.length;
        this.changeTheme();
        this.config = config[0];
        this.configService.applyCustomColors(this.config);
        if (config[0].company) {
          this.company = this.companyService.idToCompany(config[0].company);
          this.menuTitle = this.company.companyName;
          if (this.company.logoWhite) this.logoWhite = this.company.logoWhite;
        }
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
          this.user.notifications.sort(sortNotifications);
          this.currentNotificationsQtd = matchedUser.notifications.length;
        }
      });

    this.accessChecker
      .isGranted(Permissions.ELO_PRINCIPAL, 'change-configs')
      .pipe(take(1))
      .subscribe((isGranted) => {
        if (isGranted) this.userMenu.splice(1, 0, { title: 'Configurações', tag: 'config' });
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
          this.menuTitle = event.item.title === 'Início' ? this.company.companyName : event.item.title;
        }
      });

    this.menuService
      .onItemClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: { item: any; tag: string }) => {
        if (event.item.tag == 'config') {
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

  onDone(event: any) {
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
