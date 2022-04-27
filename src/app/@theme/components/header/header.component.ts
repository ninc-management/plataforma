import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  NbDialogService,
  NbMediaBreakpointsService,
  NbMenuService,
  NbSidebarService,
  NbThemeService,
} from '@nebular/theme';

import { filter, map, take, takeUntil } from 'rxjs/operators';
import { combineLatest, Subject } from 'rxjs';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { environment } from 'app/../environments/environment';
import { User } from '@models/user';
import { ConfigDialogComponent } from 'app/@theme/components/header/config/config-dialog/config-dialog.component';
import { NbAccessChecker } from '@nebular/security';
import { Permissions } from 'app/shared/services/utils.service';
import { ConfigService } from 'app/shared/services/config.service';
import { PlatformConfig } from '@models/platformConfig';

interface NbMenuItem {
  title: string;
  link?: string;
  tag?: string;
}

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();
  env = environment;
  menuButtonClicked = false;
  menuTitle = 'Nortan';
  userPictureOnly = false;
  user = new User();
  logoIcon = 'logo';
  config: PlatformConfig = new PlatformConfig();

  userMenu: NbMenuItem[] = [
    { title: 'Perfil', link: 'pages/profile' },
    { title: 'Sair', link: '/auth/logout' },
  ];

  public constructor(
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private breakpointService: NbMediaBreakpointsService,
    private dialogService: NbDialogService,
    private accessChecker: NbAccessChecker,
    private configService: ConfigService,
    public userService: UserService,
    public utils: UtilsService
  ) {}

  ngOnInit(): void {
    combineLatest([this.userService.currentUser$, this.configService.getConfig()])
      .pipe(
        takeUntil(this.destroy$),
        filter(([currentUser, config]) => currentUser._id !== undefined)
      )
      .subscribe(([currentUser, config]) => {
        this.user = currentUser;
        this.changeTheme();
        if (config.length == 0) config.push(new PlatformConfig());
        this.config = config[0];
      });

    this.userService
      .getUsers()
      .pipe(
        takeUntil(this.destroy$),
        filter((users) => users.length > 0)
      )
      .subscribe((users) => {
        const matchedUser = users.find((currentUser) => this.userService.isEqual(currentUser._id, this.user._id));
        if (matchedUser) this.user = matchedUser;
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
          this.menuTitle = event.item.title === 'Início' ? 'Nortan' : event.item.title;
        }
      });

    this.menuService
      .onItemClick()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: { item: any; tag: string }) => {
        if (event.item.tag == 'config') {
          this.dialogService.open(ConfigDialogComponent, {
            context: {
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
        this.logoIcon = ['dark', 'cosmic'].includes(theme.name) ? 'logoNoFill' : 'logo';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
}
