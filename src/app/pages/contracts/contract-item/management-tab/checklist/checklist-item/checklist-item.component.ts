import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ContractChecklistItem } from '@models/contract';
import { User } from '@models/user';
import * as contract_validation from 'app/shared/contract-validation.json';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'ngx-checklist-item',
  templateUrl: './checklist-item.component.html',
  styleUrls: ['./checklist-item.component.scss'],
})
export class ChecklistItemComponent implements OnInit {
  @Input() checklistItem: ContractChecklistItem = new ContractChecklistItem();
  @Output() itemRemoved = new EventEmitter();
  validation = (contract_validation as any).default;
  today = new Date();
  yesterday = new Date();
  responsibleSearch = '';
  avaliableResponsibles: Observable<User[]> = of([]);

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

  constructor() {}

  ngOnInit(): void {
    this.yesterday.setDate(this.today.getDate() - 1);
  }

  removeItem(): void {
    this.itemRemoved.emit();
  }
}
