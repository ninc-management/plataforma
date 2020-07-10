/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'nb-upload-queue-item',
  template: `
    <span class="file-item-caption">
      <span>{{ item.getValue().name }}</span>
      <span class="file-progress">{{ item.getValue().progress + '%' }}</span>
    </span>
    <nb-progress-bar
      [value]="item.getValue().progress"
      [status]="status"
    ></nb-progress-bar>
  `,
  styleUrls: ['./upload-queue-item.component.scss'],
})
export class NbUploadQueueItemComponent {
  @Input()
  item: BehaviorSubject<any>;

  get status(): string {
    if (this.item.getValue().progress <= 25) {
      return 'danger';
    }
    if (this.item.getValue().progress <= 50) {
      return 'warning';
    }
    if (this.item.getValue().progress <= 75) {
      return 'info';
    }
    return 'success';
  }
}
