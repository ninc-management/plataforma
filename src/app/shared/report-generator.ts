import { ElementRef } from '@angular/core';
import { Contract, ContractExpense } from '@models/contract';
import { format } from 'date-fns';
import { BrMaskDirective } from './directives/br-mask.directive';

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

function formatDate(date: Date, divider = '/'): string {
  return format(date, 'dd' + divider + 'MM' + divider + 'yyyy');
}

function codeSort(direction: number, a: string, b: string): number {
  let first = { count: 0, year: 0 };
  let second = { count: 0, year: 0 };
  let tmp = { count: a.match(/-(\d+)\//g), year: a.match(/\/(\d+)-/g) };
  if (tmp.count && tmp.year)
    tmp = {
      count: tmp.count[0].match(/\d+/g),
      year: tmp.year[0].match(/\d+/g),
    };
  if (tmp.count && tmp.year) first = { count: +tmp.count[0], year: +tmp.year[0] };
  tmp = { count: b.match(/-(\d+)\//g), year: b.match(/\/(\d+)-/g) };
  if (tmp.count && tmp.year)
    tmp = {
      count: tmp.count[0].match(/\d+/g),
      year: tmp.year[0].match(/\d+/g),
    };
  if (tmp.count && tmp.year) second = { count: +tmp.count[0], year: +tmp.year[0] };

  if (first.year < second.year) return -1 * direction;

  if (first.year > second.year) return direction;

  if (first.year == second.year) {
    if (first.count < second.count) return -1 * direction;
    else return direction;
  }
  return 0;
}
