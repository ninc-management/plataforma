import { Component, Input, OnInit } from '@angular/core';
import { ChecklistItemAction, Contract } from '@models/contract';
import { NbCalendarRange } from '@nebular/theme';
import { UserService } from 'app/shared/services/user.service';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'ngx-action-item',
  templateUrl: './action-item.component.html',
  styleUrls: ['./action-item.component.scss'],
})
export class ActionItemComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() itemIndex!: number;
  @Input() actionIndex!: number;
  action: ChecklistItemAction = new ChecklistItemAction();
  itemRange!: NbCalendarRange<Date>;
  yesterday: Date = new Date();

  constructor(public userService: UserService) {}

  ngOnInit(): void {
    if (this.itemIndex !== undefined && this.actionIndex !== undefined) {
      this.action = cloneDeep(
        this.contract.checklist[this.itemIndex].actionList[this.actionIndex]
      );
      this.itemRange = {
        start: new Date(this.action.startDate),
        end: new Date(this.action.endDate),
      };
    }
    const today = new Date();
    this.yesterday.setDate(today.getDate() - 1);
  }

  removeAction(): void {}
}
