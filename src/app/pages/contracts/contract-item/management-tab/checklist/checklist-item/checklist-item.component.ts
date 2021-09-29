import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Contract, ContractChecklistItem } from '@models/contract';
import { User } from '@models/user';
import { NbCalendarRange, NbDialogService } from '@nebular/theme';
import * as contract_validation from 'app/shared/contract-validation.json';
import { UserService } from 'app/shared/services/user.service';
import { differenceInCalendarDays, isBefore } from 'date-fns';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { take } from 'rxjs/operators';
import { ChecklistItemDialogComponent } from './checklist-item-dialog/checklist-item-dialog.component';

@Component({
  selector: 'ngx-checklist-item',
  templateUrl: './checklist-item.component.html',
  styleUrls: ['./checklist-item.component.scss'],
})
export class ChecklistItemComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() itemIndex!: number;
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Output() itemRemoved = new EventEmitter();
  validation = (contract_validation as any).default;
  today = new Date();
  yesterday = new Date();
  responsibleSearch = '';
  avaliableResponsibles: Observable<User[]> = of([]);
  checklistItem: ContractChecklistItem = new ContractChecklistItem();
  itemRange!: NbCalendarRange<Date>;

  avaliableActionStatus = [
    'Briefing',
    'Anteprojeto',
    'Estudo preliminar',
    'Projeto básico',
    'Projeto executivo',
    'Campo',
    'Prioridade',
    'Análise externa',
    'Espera',
    'Finalização',
    'Concluído',
  ];

  constructor(
    public userService: UserService,
    private dialogService: NbDialogService
  ) {}

  ngOnInit(): void {
    this.yesterday.setDate(this.today.getDate() - 1);
    if (this.itemIndex !== undefined) {
      this.checklistItem = this.contract.checklist[this.itemIndex];
      this.itemRange = {
        start: new Date(this.checklistItem.startDate),
        end: new Date(this.checklistItem.endDate),
      };
    }
  }

  removeItem(): void {
    this.itemRemoved.emit();
  }

  getTotalDays(): number {
    return differenceInCalendarDays(
      new Date(this.checklistItem.endDate),
      new Date(this.checklistItem.startDate)
    );
  }

  getRemainingDays(): number {
    const today = new Date();
    const itemStartDate = new Date(this.checklistItem.startDate);
    const end = new Date(this.checklistItem.endDate);
    if (isBefore(today, itemStartDate)) {
      return differenceInCalendarDays(end, itemStartDate);
    }
    return differenceInCalendarDays(end, today);
  }

  getPercentualItemProgress(): number {
    const total = this.getTotalDays();
    const remaining = this.getRemainingDays();
    if (total != 0) {
      const progress = total - remaining;
      return +((progress / total) * 100).toFixed(2);
    }
    return 0;
  }

  openItemDialog(): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(ChecklistItemDialogComponent, {
        context: {
          contract: this.contract,
          itemIndex: this.itemIndex,
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => {
        this.isDialogBlocked.next(false);
      });
  }
}
