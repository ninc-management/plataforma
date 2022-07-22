import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NbAccessChecker } from '@nebular/security';
import { NbSidebarComponent, NbSidebarService } from '@nebular/theme';
import { environment } from 'app/../environments/environment';
import { combineLatest, Subject } from 'rxjs';
import { filter, skipWhile, takeUntil } from 'rxjs/operators';

import { UserService } from 'app/shared/services/user.service';

import { User } from '@models/user';

@Component({
  selector: 'ngx-one-column-layout',
  styleUrls: ['./one-column.layout.scss'],
  template: `
    <nb-layout windowMode>
      <nb-layout-header
        fixed
        [ngStyle]="{
          'background-color': headerColor()
        }"
      >
        <ngx-header></ngx-header>
      </nb-layout-header>

      <nb-sidebar
        class="menu-sidebar"
        tag="menu-sidebar"
        responsive
        start
        [compactedBreakpoints]="['xs', 'is', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl']"
        #sidebar
      >
        <a routerLink="/pages/profile" (click)="sidebarService.compact('menu-sidebar')">
          <nb-user
            size="giant"
            [onlyPicture]="sidebarState == 'compacted'"
            [name]="user.exibitionName ? user.exibitionName : user.fullName"
            [title]="user.professionalEmail"
            [picture]="user.profilePicture ? user.profilePicture : ''"
          ></nb-user>
        </a>

        <ng-content select="[slot=main]"></ng-content>
        <ng-content select="[slot=config]"></ng-content>
        <ng-content select="[slot=social]"></ng-content>
      </nb-sidebar>

      <nb-layout-column>
        <ng-content select="router-outlet"></ng-content>
      </nb-layout-column>

      <nb-layout-footer fixed>
        <ngx-footer></ngx-footer>
      </nb-layout-footer>
    </nb-layout>
  `,
})
export class OneColumnLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidebar', { static: false }) sidebarRef!: NbSidebarComponent;
  private destroy$: Subject<void> = new Subject<void>();
  sidebarState = 'compacted';
  user = new User();

  public constructor(
    public userService: UserService,
    public accessChecker: NbAccessChecker,
    public sidebarService: NbSidebarService
  ) {}
  ngOnInit(): void {
    this.userService.currentUser$
      .pipe(
        takeUntil(this.destroy$),
        filter((currentUser) => currentUser._id !== undefined)
      )
      .subscribe((currentUser) => {
        this.user = currentUser;
      });

    combineLatest([this.userService.getUsers(), this.userService.isDataLoaded$])
      .pipe(
        skipWhile(([_, isUserDataLoaded]) => !isUserDataLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([users, _]) => {
        const matchedUser = users.find((currentUser) => this.userService.isEqual(currentUser._id, this.user._id));
        if (matchedUser) this.user = matchedUser;
      });
  }

  ngAfterViewInit(): void {
    this.sidebarRef?.stateChange.subscribe((data) => {
      this.sidebarState = data;
    });
  }

  headerColor(): string {
    return environment.demo != undefined ? 'var(--alert-accent-danger-color)' : 'var(--header-background-color)';
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
