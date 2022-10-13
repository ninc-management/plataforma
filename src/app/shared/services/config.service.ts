import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, skipWhile, Subject, take, takeUntil } from 'rxjs';

import { handle } from '../utils';
import { WebSocketService } from './web-socket.service';

import { PlatformConfig } from '@models/platformConfig';

export enum EXPENSE_TYPES {
  APORTE = 'Aporte',
  COMISSAO = 'Comissão',
}

export enum EXPENSE_OBJECT_TYPES {
  CONTRACT = 'contract',
  TEAM = 'team',
}

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
    businessFees: {
      support: {
        organizationPercentage: '0,00',
        nfPercentage: '0,00',
      },
      intermediation: {
        nfPercentage: '0,00',
        organizationPercentage: '0,00',
      },
    },
    codeAbbreviation: 'NINC',
  },
  profileConfig: {
    positions: [
      {
        roleTypeName: 'Administrador',
        permission: 'Administrador',
      },
      {
        roleTypeName: 'Membro',
        permission: 'Membro',
      },
      {
        roleTypeName: 'Financeiro',
        permission: 'Financeiro',
      },
    ],
    hasLevels: true,
    levels: [],
    hasTeam: true,
    hasSector: true,
    hasExpertiseBySector: true,
  },
  socialConfig: {
    youtubeLink: '',
    linkedinLink: '',
    instagramLink: '',
    glassfrogLink: '',
    gathertownLink: '',
    companyName: 'NINC',
  },
  modulesConfig: {
    hasPromotion: true,
    hasCourse: true,
  },
  oneDriveConfig: {
    isActive: false,
  },
};

export interface Colors {
  primary: string[];
  success: string[];
  warning: string[];
  info: string[];
  danger: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService implements OnDestroy {
  private requested = false;
  private destroy$ = new Subject<void>();
  private config$ = new BehaviorSubject<PlatformConfig[]>([]);
  private _isDataLoaded$ = new BehaviorSubject<boolean>(false);

  get isDataLoaded$(): Observable<boolean> {
    return this._isDataLoaded$.asObservable();
  }

  constructor(private http: HttpClient, private wsService: WebSocketService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  saveConfig(config: PlatformConfig): void {
    const req = {
      config: config,
    };
    this.http.post('/api/config/', req).pipe(take(1)).subscribe();
  }

  //INVARIANT: There's only one PlatformConfig object in the collection
  getConfig(): Observable<PlatformConfig[]> {
    if (!this.requested) {
      this.requested = true;
      this.http
        .post('/api/config/all', {})
        .pipe(take(1))
        .subscribe((configs: any) => {
          this.config$.next(configs as PlatformConfig[]);
          this._isDataLoaded$.next(true);
        });
      this.wsService
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => handle(data, this.config$, 'platformconfigs'));
    }
    return this.config$;
  }

  editConfig(config: PlatformConfig): void {
    const req = {
      config: config,
    };
    this.http.post('/api/config/update', req).pipe(take(1)).subscribe();
  }

  expenseSubTypes(type: string, objectType: EXPENSE_OBJECT_TYPES = EXPENSE_OBJECT_TYPES.TEAM): string[] {
    if (!type) return [];
    let tmpType;
    if (objectType == EXPENSE_OBJECT_TYPES.TEAM)
      tmpType = this.config$.value[0].expenseConfig.adminExpenseTypes.find((eType) => eType.name === type);
    else tmpType = this.config$.value[0].expenseConfig.contractExpenseTypes.find((eType) => eType.name === type);

    return tmpType ? tmpType.subTypes : [];
  }

  sendEvaColorsRequest(primaryColor: string): Observable<Colors> {
    const url = '/api/config/colors';
    const body = {
      // slice(1) is necessary to remove the # from HEX
      // #FFFFF -> FFFFF
      primaryColorHex: primaryColor.slice(1),
    };

    return this.http.post<Colors>(url, body).pipe(take(1));
  }

  applyCustomColors(config: PlatformConfig): void {
    let bodyStyleAttribute = '';

    if (config.socialConfig.colors.primary) {
      bodyStyleAttribute += '--color-primary-500: ' + config.socialConfig.colors.primary + ';';
    }
    if (config.socialConfig.colors.success) {
      bodyStyleAttribute += '--color-success-500: ' + config.socialConfig.colors.success + ';';
    }
    if (config.socialConfig.colors.info) {
      bodyStyleAttribute += '--color-info-500: ' + config.socialConfig.colors.info + ';';
    }
    if (config.socialConfig.colors.danger) {
      bodyStyleAttribute += '--color-danger-500: ' + config.socialConfig.colors.danger + ';';
    }
    if (config.socialConfig.colors.warning) {
      bodyStyleAttribute += '--color-warning-500: ' + config.socialConfig.colors.warning + ';';
    }

    (document.body as any).setAttribute('style', bodyStyleAttribute);
  }
}
