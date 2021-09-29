import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { ContractChecklistItem } from '@models/contract';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';

@Component({
  selector: 'ngx-checklist-item-dialog',
  templateUrl: './checklist-item-dialog.component.html',
  styleUrls: ['./checklist-item-dialog.component.scss'],
})
export class ChecklistItemDialogComponent
  extends BaseDialogComponent
  implements OnInit
{
  @Input() item!: ContractChecklistItem;

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
    @Optional() protected derivedRef: NbDialogRef<ChecklistItemDialogComponent>
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {}

  dismiss(): void {
    super.dismiss();
  }
}
