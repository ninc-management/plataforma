import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { ChecklistItemAction, Contract, ContractChecklistItem, DateRange } from '@models/contract';
import { Invoice, InvoiceTeamMember } from '@models/invoice';
import { User } from '@models/user';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { cloneDeep } from 'lodash';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'ngx-checklist-item-dialog',
  templateUrl: './checklist-item-dialog.component.html',
  styleUrls: ['./checklist-item-dialog.component.scss'],
})
export class ChecklistItemDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() contract: Contract = new Contract();
  @Input() itemIndex!: number;
  invoice: Invoice = new Invoice();
  checklistItem: ContractChecklistItem = new ContractChecklistItem();
  actionList!: ChecklistItemAction[];
  newAction: ChecklistItemAction = new ChecklistItemAction();
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

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ChecklistItemDialogComponent>,
    private contractService: ContractService,
    private utils: UtilsService,
    private invoiceService: InvoiceService,
    public userService: UserService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    if (this.contract.invoice) {
      this.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
    }
    if (this.itemIndex !== undefined) {
      this.checklistItem = cloneDeep(this.contract.checklist[this.itemIndex]);
      this.actionList = cloneDeep(this.checklistItem.actionList);
    }
    this.avaliableResponsibles = this.getAvaliableResponsibles();
  }

  dismiss(): void {
    super.dismiss();
  }

  getAvaliableResponsibles(): Observable<User[]> {
    return of(
      this.invoice.team
        .map((member: InvoiceTeamMember) => {
          return member.user ? this.userService.idToUser(member.user) : undefined;
        })
        .filter((user: User | undefined): user is User => user !== undefined)
    );
  }

  registerAction(): void {
    if (this.itemIndex !== undefined) {
      this.newAction.range = this.newAction.range as DateRange;
      this.actionList.push(cloneDeep(this.newAction));
      this.newAction = new ChecklistItemAction();
      this.responsibleSearch = '';
    }
  }

  removeAction(index: number): void {
    this.actionList.splice(index, 1);
  }

  updateAction(): void {
    this.checklistItem.actionList = cloneDeep(this.actionList);
    this.contract.checklist[this.itemIndex] = cloneDeep(this.checklistItem);
    this.dismiss();
  }

  getFormattedRange(range: DateRange): string | undefined {
    if (range.end) {
      return this.utils.formatDate(range.start) + ' - ' + this.utils.formatDate(range.end);
    }
    return this.utils.formatDate(range.start);
  }
}
