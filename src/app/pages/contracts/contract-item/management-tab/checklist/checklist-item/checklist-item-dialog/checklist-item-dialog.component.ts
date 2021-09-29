import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { Contract, ContractChecklistItem } from '@models/contract';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { ContractService } from 'app/shared/services/contract.service';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'ngx-checklist-item-dialog',
  templateUrl: './checklist-item-dialog.component.html',
  styleUrls: ['./checklist-item-dialog.component.scss'],
})
export class ChecklistItemDialogComponent
  extends BaseDialogComponent
  implements OnInit
{
  @Input() contract!: Contract;
  @Input() itemIndex!: number;
  checklistItem!: ContractChecklistItem;

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
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ChecklistItemDialogComponent>,
    private contractService: ContractService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    this.checklistItem = cloneDeep(this.contract.checklist[this.itemIndex]);
  }

  dismiss(): void {
    super.dismiss();
  }

  updateItemNotes(): void {
    this.contract.checklist[this.itemIndex] = this.checklistItem;
    this.contractService.editContract(this.contract);
  }
}
