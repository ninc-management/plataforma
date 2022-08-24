import { Component, OnInit } from '@angular/core';

enum ReportTypes {
  ANNUAL = 'Relatório anual dos usuários',
  ONGOING_CONTRACTS = 'Contratos em andamento',
  CONTRACT_EXPENSES = 'Despesas do contrato',
}

@Component({
  selector: 'ngx-report-menu',
  templateUrl: './report-menu.component.html',
  styleUrls: ['./report-menu.component.scss'],
})
export class ReportMenuComponent implements OnInit {
  reportTypes = ReportTypes;
  selectedReportOption = ReportTypes.ANNUAL;

  constructor() {}

  ngOnInit(): void {}
}
