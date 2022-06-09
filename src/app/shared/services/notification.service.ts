import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { combineLatest, Subject } from 'rxjs';
import { map, skipWhile, take } from 'rxjs/operators';
import { UserService } from './user.service';
import { TeamMember } from '@models/team';
import { User, UserNotification } from '@models/user';
import { InvoiceTeamMember } from '@models/invoice';
import { cloneDeep } from 'lodash';
import { isOfType } from '../utils';
import { ConfigService } from './config.service';

export interface NotificationBody {
  title: string;
  tag: string;
  message: string;
}

export enum NotificationTags {
  MENTION = 'mention',
  EXPENSE_PAID = 'expense-paid',
  PAYMENT_ORDER_PAID = 'payment-order-paid',
  RECEIPT_PAID = 'receipt-paid',
  CONTRACT_SIGNED = 'contract-signed',
  APPOINTED_AS_ASSIGNEE = 'appointed-as-assignee',
  VALUE_TO_RECEIVE_PAID = 'value-to-receive-paid',
  EXPENSE_ORDER_CREATED = 'expense-order-created',
  PAYMENT_ORDER_CREATED = 'payment-order-created',
  RECEIPT_ORDER_CREATED = 'receipt-order-created',
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private userService: UserService, private configService: ConfigService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  notify(user: User | string | undefined, body: NotificationBody): void {
    if (user) {
      const notification = new UserNotification();
      notification.title = body.title;
      notification.tag = body.tag;
      notification.message = body.message;
      notification.to = this.userService.idToUser(user)._id;
      this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
        notification.from = user._id;
      });
      const req = {
        notification: notification,
      };
      this.http.post('/api/notify/', req).pipe(take(1)).subscribe();
    }
  }

  notifyMany(users: User[] | TeamMember[] | InvoiceTeamMember[], body: NotificationBody): void {
    const notifications: UserNotification[] = [];
    const newNotification = new UserNotification();
    newNotification.title = body.title;
    newNotification.tag = body.tag;
    newNotification.message = body.message;
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      newNotification.from = user._id;
    });
    users.forEach((to) => {
      if (isOfType<User>(to, ['fullName', 'sectors', 'position'])) newNotification.to = to;
      else newNotification.to = to.user;
      if (newNotification.to) newNotification.to = this.userService.idToUser(newNotification.to)._id;
      notifications.push(cloneDeep(newNotification));
    });

    const req = {
      notifications: notifications,
    };
    this.http.post('/api/notify/many', req).pipe(take(1)).subscribe();
  }

  checkNotification(notification: UserNotification) {
    if (notification.to && notification.from) {
      notification.to = this.userService.idToUser(notification.to)._id;
      notification.from = this.userService.idToUser(notification.from)._id;
      this.http.post('/api/notify/read', { notification: notification }).pipe(take(1)).subscribe();
    }
  }

  notifyFinancial(notificationBody: NotificationBody): void {
    combineLatest([
      this.userService.getUsers(),
      this.configService.getConfig(),
      this.userService.isDataLoaded$,
      this.configService.isDataLoaded$,
    ])
      .pipe(
        skipWhile(([_, , isUserDataLoaded, isConfigDataLoaded]) => !isUserDataLoaded || !isConfigDataLoaded),
        take(1),
        map(([users, config, , _]) => {
          return users.filter((user) =>
            config[0].profileConfig.positions.some((pos) => {
              return user.position.includes(pos.roleTypeName) && pos.permission === 'Financeiro';
            })
          );
        })
      )
      .subscribe((users) => {
        this.notifyMany(users, notificationBody);
      });
  }
}
