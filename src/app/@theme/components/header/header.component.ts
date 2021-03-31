import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  NbMediaBreakpointsService,
  NbMenuService,
  NbSidebarService,
  NbThemeService,
} from '@nebular/theme';

import { map, takeUntil } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { UserService } from '../../../shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject<void>();
  public readonly materialTheme$: Observable<boolean>;
  menuButtonClicked = false;
  menuTitle = 'Nortan';
  userPictureOnly: boolean = false;
  user: any;
  logoIcon: string = 'logo';

  userMenu = [
    { title: 'Perfil', link: 'pages/profile' },
    { title: 'Sair', link: '/auth/logout' },
  ];

  public constructor(
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private userService: UserService,
    private breakpointService: NbMediaBreakpointsService,
    public utils: UtilsService
  ) {}

  ngOnInit() {
    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => {
        this.user = user;
        this.changeTheme();
      });

    const { sm, xl } = this.breakpointService.getBreakpointsMap();
    this.themeService
      .onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$)
      )
      .subscribe(
        (isLessThanXl: boolean) => (this.userPictureOnly = isLessThanXl)
      );

    this.menuService
      .onItemSelect()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: { tag: string; item: any }) => {
        if (document.documentElement.clientWidth <= sm) {
          this.menuTitle =
            event.item.title === 'Início' ? 'Nortan' : event.item.title;
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
        this.logoIcon = ['dark', 'cosmic'].includes(theme.name)
          ? 'logoWhite'
          : 'logo';
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeTheme() {
    this.themeService.changeTheme(
      this.user.theme == undefined ? 'default' : this.user.theme
    );
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');

    return false;
  }

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }
}
