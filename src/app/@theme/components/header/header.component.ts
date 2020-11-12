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

  themes = [
    {
      value: 'default',
      name: 'Claro',
    },
    {
      value: 'dark',
      name: 'Escuro',
    },
    {
      value: 'cosmic',
      name: 'Cosmico',
    },
    {
      value: 'corporate',
      name: 'Emprasarial',
    },
  ];

  currentTheme = 'default';

  userMenu = [
    { title: 'Perfil', link: 'pages/profile' },
    { title: 'Sair', link: '/auth/logout' },
  ];

  public constructor(
    private sidebarService: NbSidebarService,
    private menuService: NbMenuService,
    private themeService: NbThemeService,
    private userService: UserService,
    private breakpointService: NbMediaBreakpointsService
  ) {
    this.materialTheme$ = this.themeService.onThemeChange().pipe(
      map((theme) => {
        const themeName: string = theme?.name || '';
        return themeName.startsWith('material');
      })
    );
  }

  ngOnInit() {
    this.currentTheme = this.themeService.currentTheme;

    this.userService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: any) => (this.user = user));

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

    this.themeService.onThemeChange().pipe(
      map(({ name }) => name),
      takeUntil(this.destroy$)
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
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changeTheme(themeName: string) {
    this.themeService.changeTheme(themeName);
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');

    return false;
  }

  navigateHome() {
    this.menuService.navigateHome();
    return false;
  }

  isPhone(): boolean {
    const { sm } = this.breakpointService.getBreakpointsMap();
    return document.documentElement.clientWidth <= sm;
  }
}
