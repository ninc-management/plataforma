import { Component, Input, OnInit } from '@angular/core';
import { ChecklistItemAction, Contract } from '@models/contract';
import { NbCalendarRange } from '@nebular/theme';
import { ContractService } from 'app/shared/services/contract.service';
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

  constructor(
    public userService: UserService,
    private contractService: ContractService
  ) {}

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

  removeAction(): void {
    if (this.itemIndex !== undefined && this.actionIndex !== undefined) {
      this.contract.checklist[this.itemIndex].actionList.splice(
        this.actionIndex,
        1
      );
      this.contractService.editContract(this.contract);
    }
  }

  onCheckedChange(): void {
    if (this.itemIndex !== undefined && this.actionIndex !== undefined) {
      this.action.isFinished = true;
      this.contract.checklist[this.itemIndex].actionList[this.actionIndex] =
        this.action;
      this.contractService.editContract(this.contract);
    }
  }
}
