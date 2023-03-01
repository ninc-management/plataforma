import { ElementRef } from '@angular/core';

import { BrMaskDirective } from './directives/br-mask.directive';
import { codeSort, formatDate, idToProperty } from './utils';
import { GROUPING_TYPES, ReportValue } from 'app/pages/dashboard/report-menu/annual-report/annual-report.component';

import { Contract, ContractExpense } from '@models/contract';
import { Sector } from '@models/shared/sector';
import { User } from '@models/user';

interface ExpensesData {
  expenses: ContractExpense[];
  subTotal: string;
}

export function generateExpensesReport(contract: Contract): string {
  const mappedExpenses = mapExpensesByCategory(contract);
  const mainHeaders = ['Nº', '', 'GASTOS/SAÍDAS', 'DATA DE PAGAMENTO', 'VALOR DA DESPESA'];
  let csv = mainHeaders.join(';') + '\r\n';

  //Listing expenses by category
  Object.keys(mappedExpenses).forEach((category) => {
    csv += ' ;' + category.toUpperCase() + ';' + getDetailColumnByCategory(category) + ';' + ';' + ';';
    csv += '\r\n';
    mappedExpenses[category].expenses.forEach((expense) => {
      csv +=
        expense.code +
        ';' +
        expense.description +
        ';' +
        ';' +
        (expense.paidDate ? formatDate(expense.paidDate) : 'Não pago') +
        ';' +
        'R$ ' +
        expense.value +
        ';' +
        '\r\n';

      mappedExpenses[category].subTotal = sumMoney(mappedExpenses[category].subTotal, expense.value);
    });
    csv += '\r\n';
    csv += ';' + 'SUBTOTAL' + ';' + ';' + ';' + 'R$ ' + mappedExpenses[category].subTotal + ';';
    csv += '\r\n\r\n';
  });

  csv += ';' + 'TOTAL' + ';' + ';' + ';' + 'R$ ' + getExpensesTotalValue(mappedExpenses) + ';';
  csv += '\r\n\r\n';

  //Categories sub total summary
  Object.keys(mappedExpenses).forEach((category) => {
    csv += ';' + category.toUpperCase() + ';' + ';' + ';' + 'R$ ' + mappedExpenses[category].subTotal + ';';
    csv += '\r\n';
  });

  return csv;
}

export function generateUsersReport(
  data: Record<string, ReportValue>,
  groupBy: GROUPING_TYPES,
  userRevival: (id: string | User) => User,
  sectorRevival: (id: string | Sector | undefined) => string
): string {
  const header = [
    '',
    'Janeiro;;;;',
    'Fevereiro;;;;',
    'Março;;;;',
    'Abril;;;;',
    'Maio;;;;',
    'Junho;;;;',
    'Julho;;;;',
    'Agosto;;;;',
    'Setembro;;;;',
    'Outubro;;;;',
    'Novembro;;;;',
    'Dezembro;;;;',
    'Resumos;;;;;;;;',
  ];
  const monthlySubHeader = ['Recebido', 'Despesas', 'Orçamentos Passados', 'Contratos Fechado', 'Contrato Entregues'];
  const overviewSubHeader = [
    'Total Recebido',
    'Total Despesas',
    'A Receber',
    'Total Orçamentos Gestor',
    'Total Orçamentos Equipe',
    'Total Contratos Gestor',
    'Total Contratos Equipe',
    'Total Contrato Entregues Gestor',
    'Total Contrato Entregues Equipe',
  ];
  let csv = header.join(';');
  csv += '\r\n';
  csv += groupBy == GROUPING_TYPES.USER ? 'Associados;' : 'Setores;';
  for (let i = 0; i < 12; i++) {
    csv += monthlySubHeader.join(';') + ';';
  }
  csv += overviewSubHeader.join(';');
  csv += '\r\n';

  for (const key of Object.keys(data)) {
    csv += (groupBy == GROUPING_TYPES.USER ? idToProperty(key, userRevival, 'fullName') : sectorRevival(key)) + ';';
    data[key].monthly_data.forEach((individualData: any) => {
      csv += individualData.received + ';';
      csv += individualData.expenses + ';';
      csv += (individualData.sent_invoices_manager + individualData.sent_invoices_team).toString() + ';';
      csv += (individualData.opened_contracts_manager + individualData.opened_contracts_team).toString() + ';';
      csv += (individualData.concluded_contracts_manager + individualData.concluded_contracts_team).toString() + ';';
    });
    csv += data[key].overview.received + ';';
    csv += data[key].overview.expenses + ';';
    csv += data[key].overview.to_receive + ';';
    csv += data[key].overview.sent_invoices_manager.toString() + ';';
    csv += data[key].overview.sent_invoices_team.toString() + ';';
    csv += data[key].overview.opened_contracts_manager.toString() + ';';
    csv += data[key].overview.opened_contracts_team.toString() + ';';
    csv += data[key].overview.concluded_contracts_manager.toString() + ';';
    csv += data[key].overview.concluded_contracts_team.toString();
    csv += '\r\n';
  }
  return csv;
}

function mapExpensesByCategory(contract: Contract): Record<string, ExpensesData> {
  contract.expenses.sort((a, b) => codeSort(1, a.code, b.code));
  return contract.expenses.reduce((mappedExpenses: Record<string, ExpensesData>, expense) => {
    if (!mappedExpenses[expense.type]) {
      mappedExpenses[expense.type] = { expenses: [], subTotal: '0' };
      mappedExpenses[expense.type].expenses = [];
    }
    mappedExpenses[expense.type].expenses.push(expense);
    return mappedExpenses;
  }, {});
}

function getExpensesTotalValue(mappedExpenses: Record<string, ExpensesData>): string {
  return Object.keys(mappedExpenses).reduce(
    (total, category) => (total = sumMoney(total, mappedExpenses[category].subTotal)),
    '0'
  );
}

function getDetailColumnByCategory(category: string): string {
  switch (category.toUpperCase()) {
    case 'FOLHA DE PAGAMENTO':
      return 'FUNÇÃO';
    case 'MATERIAL':
      return 'FORNECEDOR';
    case 'PRÉ-OBRA':
      return 'DESCRIÇÃO';
    case 'TRANSPORTE E ALIMENTAÇÃO':
      return 'FORNECEDOR';
    case 'OUTROS':
      return 'FORNECEDOR';

    default:
      return 'DESCRIÇÃO';
  }
}

//String utils and utils function
function moneyToNumber(money: string | undefined): number {
  if (money === undefined || money === '') return 0;
  const result = money.replace(/\./g, '').replace(',', '.');
  return +result;
}

function numberToMoney(value: number, decimals = 2): string {
  const brMask = new BrMaskDirective(new ElementRef(''));
  const result = brMask.writeValueMoney(value.toFixed(decimals).toString(), {
    money: true,
    thousand: '.',
    decimalCaracter: ',',
    decimal: decimals,
    moneyInitHasInt: false,
  });
  return value < 0 ? '-' + result : result;
}

function sumMoney(value1: string, value2: string, decimals = 2): string {
  return numberToMoney(moneyToNumber(value1) + moneyToNumber(value2), decimals);
}
