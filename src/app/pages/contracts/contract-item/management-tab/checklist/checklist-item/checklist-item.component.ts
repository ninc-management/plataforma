import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Contract, ContractChecklistItem } from '@models/contract';
import { User } from '@models/user';
import { NbCalendarRange } from '@nebular/theme';
import * as contract_validation from 'app/shared/contract-validation.json';
import { UserService } from 'app/shared/services/user.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'ngx-checklist-item',
  templateUrl: './checklist-item.component.html',
  styleUrls: ['./checklist-item.component.scss'],
})
export class ChecklistItemComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() itemIndex!: number;
  @Output() itemRemoved = new EventEmitter();
  validation = (contract_validation as any).default;
  today = new Date();
  yesterday = new Date();
  responsibleSearch = '';
  avaliableResponsibles: Observable<User[]> = of([]);
  checklistItem!: ContractChecklistItem;
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

  constructor(public userService: UserService) {}

  ngOnInit(): void {
    this.yesterday.setDate(this.today.getDate() - 1);
    this.checklistItem = this.contract.checklist[this.itemIndex];
    this.itemRange = {
      start: new Date(this.checklistItem.startDate),
      end: new Date(this.checklistItem.endDate),
    };
  }

  removeItem(): void {
    this.itemRemoved.emit();
  }
}
