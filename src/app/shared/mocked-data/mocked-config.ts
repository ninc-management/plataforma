import { EXPENSE_TYPES } from '../services/config.service';
import { Fees } from '../utils';
import { externalMockedCompanies } from './mocked-companies';

import { PlatformConfig } from '@models/platformConfig';

export const DEFAULT_CONFIG = {
  notificationConfig: {
    contractClosed: {
      email: true,
      platform: true,
    },
    userMentioned: {
      email: true,
      platform: true,
    },
    transactionCreated: {
      email: true,
      platform: true,
    },
    transactionPaid: {
      email: true,
      platform: true,
    },
    teamMemberPaid: {
      email: true,
      platform: true,
    },
    receiptDue: {
      email: true,
      platform: true,
    },
    stageResponsible: {
      email: true,
      platform: true,
    },
  },
  expenseConfig: {
    adminExpenseTypes: [
      {
        name: 'Empréstimos',
        subTypes: [],
      },
      {
        name: 'Custo Fixo',
        subTypes: [
          'Aluguel',
          'Anuidade em Conselhos',
          'Divisão de Lucro',
          'Energia',
          'Equipamentos',
          'Internet',
          'Folha de Pagamento',
          'Transporte - Colaborador Interno',
          'Veículos',
          'Outros',
        ],
      },
      {
        name: 'Custo Variável',
        subTypes: ['Combustível', 'Equipamentos', 'Manutenção', 'Veículos', 'Softwares', 'Outros'],
      },
      {
        name: 'Despesa Fixa',
        subTypes: ['Benefícios - Colaboradores', 'Infraestrutura Digital', 'Limpeza e Copa', 'Marketing', 'Outros'],
      },
      {
        name: 'Despesa Variável',
        subTypes: [
          'Bonificação/Premiação',
          'Cursos',
          'Eventos',
          'Fardas e Similares',
          'Infraestrutura',
          'Infraestrutura Digital',
          'Manutenção',
          'Minuterias - Dscritório',
          'Terceirização',
          'Outros',
        ],
      },
      {
        name: 'Encargos',
        subTypes: [],
      },
      {
        name: 'Impostos',
        subTypes: [],
      },
      {
        name: 'Investimentos',
        subTypes: [],
      },
      {
        name: 'Receita',
        subTypes: [],
      },
      {
        name: 'Outros',
        subTypes: [],
      },
    ],
    contractExpenseTypes: [
      {
        name: 'Alimentação',
        subTypes: [],
      },
      {
        name: EXPENSE_TYPES.APORTE,
        subTypes: [],
      },
      {
        name: EXPENSE_TYPES.COMISSAO,
        subTypes: [],
      },
      {
        name: 'Folha de Pagamento',
        subTypes: [],
      },
      {
        name: 'Gasolina',
        subTypes: [],
      },
      {
        name: 'Material',
        subTypes: [
          'Aditivos - Massas',
          'Andaimes',
          'Areia',
          'Argamassa',
          'Bacias - Pia',
          'Bacias - Sanitário',
          'Bloco Cerâmico',
          'Brita',
          'Cabos Elétricos',
          'Caixas - Hidrossanitário',
          'Caixas - Quadros Elétricos',
          'Cerâmica',
          'Cimento',
          'Conexões - Elétrico',
          'Conexões - Hidrossanitário',
          'Drywall',
          'EPI/EPC',
          'Escoras',
          'Estruturas Metálicas',
          'Ferramentas / Máquinas',
          'Ferro',
          'Gesso - Forro',
          'Gesso - Parede',
          'Granito',
          'Impermeabilizante Mantas',
          'Impermeabilizantes Líquidos',
          'Isobloco',
          'Janelas - Madeira',
          'Janelas - Metálicas',
          'Janelas - PVC',
          'Lã de Vidro, Pet ou Similares',
          'Lajota Cerâmica',
          'Lajota Isopor',
          'Lâmpadas e Luminárias',
          'Madeira Estrutural',
          'Madeira',
          'Malhas de ferro',
          'Nervura',
          'Peças - Esquadria',
          'Peças - Elétrica',
          'Peças - Hidrossanitário',
          'Pintura',
          'Placa Cimentícia',
          'Placa de EPS',
          'Porcelanato',
          'Portas',
          'PVC - Forro',
          'Steal Frame',
          'Telhas',
          'Tijolo',
          'Tomadas',
          'Tubos Elétricos',
          'Tubos Hidrossanitários',
          'Vidros',
          'Outros',
        ],
      },
      {
        name: 'Pré-Serviço',
        subTypes: [],
      },
      {
        name: 'Receita',
        subTypes: [],
      },
      {
        name: 'Terceirização',
        subTypes: [
          'Alvenaria / Vedação',
          'Coberta / Forros',
          'Esquadrias',
          'Estudos Técnicos Especializados',
          'Execução de Muro',
          'Impermeabilizações',
          'Infra-estrutura',
          'Instalações Elétricas',
          'Instalacoes Hidrosanitaria',
          'Instalacoes Telefônicas',
          'Louças e Metais - Instalação (materiais fornecidos pelo cliente)',
          'Pavimentacão',
          'Pintura Geral',
          'Revestimentos',
          'Serviços Complementares',
          'Servicos Preliminares e Gerais',
          'Supra-estrutura',
          'Trabalhos em Terra',
        ],
      },
      {
        name: 'Transporte',
        subTypes: [],
      },
      {
        name: 'Locação',
        subTypes: ['Escoras', 'Andaimes', 'Gerador', 'Martelete', 'Furadeira', 'Serra Disco', 'Outros'],
      },
      {
        name: 'Outros',
        subTypes: [],
      },
    ],
    isDuplicated: false,
  },
  invoiceConfig: {
    hasType: true,
    hasHeader: true,
    hasTeam: true,
    hasPreliminary: true,
    hasExecutive: true,
    hasComplementary: true,
    hasStageName: true,
    hasImportants: true,
    hasMaterialList: true,
    hasProvider: true,
    hasMarketingPage: true,
    units: [],
    businessFees: {
      support: {
        organizationPercentage: Fees.NORTAN_SUPPORT,
        nfPercentage: Fees.NF_SUPPORT,
      },
      intermediation: {
        nfPercentage: Fees.NF_INTERMEDIATION,
        organizationPercentage: Fees.NORTAN_INTERMEDIATION,
      },
    },
    codeAbbreviation: 'NINC',
  },
  profileConfig: {
    positions: [
      {
        roleTypeName: 'Administrador',
        permission: {
          dashboard: ['*'],
          configurações: ['*'],
          perfil: ['*'],
          usuário: ['*'],
          contratos: ['*'],
          orçamentos: ['*'],
          clientes: ['*'],
          fornecedores: ['*'],
          times: ['*'],
          cursos: ['*'],
          promoções: ['*'],
        },
      },
      {
        roleTypeName: 'Membro',
        permission: {
          dashboard: ['*'],
          configurações: [],
          perfil: ['*'],
          usuário: [],
          contratos: ['*'],
          orçamentos: ['*'],
          clientes: [],
          fornecedores: [],
          times: [],
          cursos: [],
          promoções: [],
        },
      },
      {
        roleTypeName: 'Financeiro',
        permission: {
          dashboard: ['*'],
          configurações: [],
          perfil: [],
          usuário: [],
          contratos: ['*'],
          orçamentos: ['*'],
          clientes: [],
          fornecedores: [],
          times: [],
          cursos: [],
          promoções: [],
        },
      },
    ],
    hasLevels: true,
    levels: [],
    hasTeam: true,
    hasSector: true,
    hasExpertiseBySector: true,
  },
  modulesConfig: {
    hasPromotion: true,
    hasCourse: true,
  },
  oneDriveConfig: {
    isActive: true,
    contracts: {
      oneDriveId: '0',
      folderId: '1',
    },
    providers: {
      oneDriveId: '0',
      folderId: '1',
    },
  },
};
const defaultConfig = DEFAULT_CONFIG as any;
defaultConfig._id = '0';
defaultConfig.company = externalMockedCompanies[0]._id;

export const externalMockedConfigs: PlatformConfig[] = [defaultConfig as PlatformConfig];
