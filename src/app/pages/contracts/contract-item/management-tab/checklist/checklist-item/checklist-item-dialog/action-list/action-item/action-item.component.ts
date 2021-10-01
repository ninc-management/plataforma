import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ChecklistItemAction } from '@models/contract';
import { NbCalendarRange } from '@nebular/theme';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';

@Component({
  selector: 'ngx-action-item',
  templateUrl: './action-item.component.html',
  styleUrls: ['./action-item.component.scss'],
})
export class ActionItemComponent implements OnInit {
  @Input() action: ChecklistItemAction = new ChecklistItemAction();
  @Output() actionRemoved = new EventEmitter();
  itemRange!: NbCalendarRange<Date>;
  yesterday: Date = new Date();

  constructor(public userService: UserService, private utils: UtilsService) {}

  ngOnInit(): void {
    this.itemRange = {
      start: new Date(this.action.startDate),
      end: new Date(this.action.endDate),
    };

    const today = new Date();
    this.yesterday.setDate(today.getDate() - 1);
  }

  getFormattedRange(): string | undefined {
    if (this.itemRange.end) {
      return (
        this.utils.formatDate(this.itemRange.start) +
        ' - ' +
        this.utils.formatDate(this.itemRange.end)
      );
    }
    return this.utils.formatDate(this.itemRange.start);
  }

  removeActionItem(): void {
    this.actionRemoved.emit();
  }
}
