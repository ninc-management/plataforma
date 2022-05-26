import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { UserService } from './user.service';
import { TeamMember } from '@models/team';
import { User, UserNotification } from '@models/user';
import { InvoiceTeamMember } from '@models/invoice';
import { cloneDeep } from 'lodash';
import { isOfType } from '../utils';

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
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private userService: UserService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  notify(user: User | string | undefined, body: NotificationBody): void {
    if (user) {
      const notification = new UserNotification();
      notification.title = body.title;
      // notification.tag = body.tag;
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
    // newNotification.tag = body.tag;
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
}
