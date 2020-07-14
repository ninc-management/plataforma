import { Component, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { ContractDialogComponent } from './contract-dialog/contract-dialog.component';

@Component({
  selector: 'ngx-contracts',
  templateUrl: './contracts.component.html',
  styleUrls: ['./contracts.component.scss'],
})
export class ContractsComponent implements OnInit {
  constructor(private dialogService: NbDialogService) {}

  ngOnInit(): void {}

  contractDialog(): void {
    this.dialogService.open(ContractDialogComponent, {
      context: {
        title: 'Cadastro de contrato',
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: true,
      closeOnEsc: true,
    });
  }
}
