import { ElementRef } from '@angular/core';

import { BrMaskDirective } from './directives/br-mask.directive';
import { codeSort, formatDate, idToProperty } from './utils';
import {
  GROUPING_TYPES,
  ReportValue,
  TeamData,
} from 'app/pages/dashboard/report-menu/annual-report/annual-report.component';

import { Contract, ContractExpense } from '@models/contract';
import { Sector } from '@models/shared';
import { Team } from '@models/team';
import { User } from '@models/user';

export enum EXCLUDED_TYPOLOGIES {
  BALANCE = 'caixa',
}

export enum EXCLUDED_EXPENSE_TYPES {
  TRANSFER = 'Transferência',
}

interface ExpensesData {
  expenses: ContractExpense[];
  subTotal: string;
}

interface Metrics {
  name: string;
  property: keyof TeamData;
  description: string;
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

export function generateTeamsReport(
  data: Record<string, TeamData[]>,
  teamRevival: (id: string | Team) => Team
): string {
  const header = [
    'ID',
    'Metrica',
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
    'Descrição',
  ];
  const metrics: Metrics[] = [
    {
      name: 'R$ Suporte Empresarial',
      property: 'support_organization',
      description: 'Soma do valor BRUTO das OEs dos contratos do time nessa modalidade no mês',
    },
    {
      name: 'R$ Intermediação de Negócios',
      property: 'support_personal',
      description: 'Soma do valor BRUTO das OEs dos contratos do time nessa modalidade no mês',
    },
    {
      name: 'R$ Total Bruto',
      property: 'oe_gross',
      description: 'Soma através da plataforma de todas as OEs Valor bruto no mês',
    },
    { name: 'R$ Imposto Recolhido', property: 'oe_nf', description: 'Soma do valor dos impostos das OEs no mês' },
    {
      name: 'R$ Taxa Empresarial',
      property: 'oe_organization',
      description: 'Soma do valor da taxa empresarial das OEs no mês',
    },
    { name: 'R$ Total Liquido', property: 'oe_net', description: 'Soma do valor liquido das OEs no mês' },
    {
      name: 'Ordens de Pagamento',
      property: 'op',
      description: 'Soma do valor total das Ordens de pagamento PAGAS no mês',
    },
    {
      name: 'Despesas',
      property: 'expenses',
      description: 'Despesas PAGAS no mês, soma de todos os contratos do time',
    },
    { name: 'Total de Despesas', property: 'expenses_total', description: 'Soma do item 7 + item 8' },
    { name: 'Balanço Liquido do time', property: 'net_balance', description: 'Diferença do item 6 - item 9' },
    {
      name: 'R$ Orçamentos Enviados',
      property: 'sent_invoices_value',
      description: 'Soma dos valores dos orçamentos enviados no mês',
    },
    {
      name: 'R$ Orçamentos Fechados',
      property: 'concluded_invoices_value',
      description: 'Soma dos valores dos orçamentos fechados no mês',
    },
    {
      name: 'Nº Orçamentos Enviados',
      property: 'sent_invoices',
      description: 'Soma da quantidade de orçamentos enviados no mês',
    },
    {
      name: 'Nº Orçamentos Fechados',
      property: 'concluded_invoices',
      description: 'Soma da quantidade de orçamentos fechados no mês',
    },
    {
      name: 'Média Tempo de Conversão',
      property: 'convertion_time',
      description:
        'MÉDIA da Diferença da data de envio do orçamento e da data que o orçamento foi fechado, considerando todos os contrato FECHADOS deste mês. Pego Os orçamentos fechados, faço a diferença da data de envio (pode ter sido dois meses atrás) e da data que ele foi fechado (mês vigente), e faço uma média disso. Teremos o Tempo de Conversão médio do time naquele mês',
    },
    {
      name: 'Caixa do Time',
      property: 'balance',
      description: 'No momento, soma do caixa dos contratos no dia que o relatório foi gerado',
    },
    {
      name: 'R$ Saldo dos Contratos',
      property: 'not_paid',
      description: 'Soma da diferença do valor bruto dos contrato e dar OEs PAGAS',
    },
    {
      name: 'Nº Contratos em andamento',
      property: 'ongoing_contracts',
      description: 'Contratos em andamento no dia da exportação',
    },
    {
      name: 'R$ OE em aberto',
      property: 'ongoing_oe_value',
      description: 'Soma do R$ das OEs "a receber" no dia da exportação',
    },
    {
      name: 'Nº OE em aberto',
      property: 'ongoing_oe',
      description: 'Soma da quantidade de OEs "a receber" no dia da exportação',
    },
    {
      name: 'R$ Orçamentos em Análise',
      property: 'ongoing_invoice_value',
      description: 'Soma dos valores de orçamento em análise no dia da exportação',
    },
    {
      name: 'Nº Orçamentos em Análise',
      property: 'ongoing_invoice',
      description: 'Soma da quantidade de orçamentos em análise no dia da exportação',
    },
  ];
  let csv = '';

  for (const key of Object.keys(data)) {
    csv += idToProperty(key, teamRevival, 'abrev') + ';' + idToProperty(key, teamRevival, 'name') + ';';
    csv += formatDate(new Date()) + ';;;;;;;;;;;;\r\n';
    csv += header.join(';');
    csv += '\r\n';
    const teamData = data[key];
    for (let i = 0; i < metrics.length; i++) {
      csv += (i + 1).toString() + ';';
      csv += metrics[i].name + ';';
      for (let j = 0; j < data[key].length; j++) {
        csv += teamData[j][metrics[i].property] + ';';
      }
      csv += metrics[i].description + ';';
      csv += '\r\n';
    }
    csv += '\r\n';
  }
  return csv;
}

function mapExpensesByCategory(contract: Contract): Record<string, ExpensesData> {
  contract.expenses.sort((a, b) => codeSort(1, a.code, b.code));
  return contract.expenses
    .filter((expense) => expense.type != EXCLUDED_EXPENSE_TYPES.TRANSFER)
    .reduce((mappedExpenses: Record<string, ExpensesData>, expense) => {
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
