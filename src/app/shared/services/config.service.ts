import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { BehaviorSubject, Observable, Subject, take, takeUntil } from 'rxjs';

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
          'Transporte - colaborador interno',
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
        subTypes: ['Benefícios-colaboradores', 'Infraestrutura digital', 'Limpeza e copa', 'Marketing', 'Outros'],
      },
      {
        name: 'Despesa Variável',
        subTypes: [
          'Bonificação/Premiação',
          'Cursos',
          'Eventos',
          'Fardas e similares',
          'Infraestrutura',
          'Infraestrutura digital',
          'Manutenção',
          'Minuterias - escritório',
          'Tercerização',
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
        name: ' Aporte',
        subTypes: [],
      },
      {
        name: 'Comissão',
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
          'Bacias - pia',
          'Bacias - sanitário',
          'Bloco cerámico',
          'Brita',
          'Cabos Elétricos',
          'Caixas - Hidrossanitário',
          'Caixas - Quadros Elétricas',
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
          'Gesso - forro',
          'Gesso - parede',
          'Granito ',
          'Impermeabilizante Mantas',
          'Impermeabilizantes Líquidos',
          'Isobloco',
          'Janelas - Madeira',
          'Janelas - metálicas',
          'Janelas - PVC',
          'Lã de vidro, pet ou similares',
          'Lajota Cerámica',
          'Lajota Isopor',
          'Lampadas e Luminárias',
          'Madeira estrutural',
          'Madeira',
          'Malhas de ferro',
          'Nervura',
          'Peças - Esquadria',
          'Peças - Elétrica',
          'Peças - Hidrossanitário',
          'Pintura',
          'Placa cimentícia',
          'Placa de EPS',
          'Porcelanato',
          'Portas',
          'PVC - forro',
          'Steal frame',
          'Telhas',
          'Tijolo',
          'Tomadas',
          'Tubos Elétrico',
          'Tubos hidrossanitário',
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
        name: 'Tercerização',
        subTypes: [
          'Estudos técnicos especializados',
          'Instalação Elétrica',
          'Servicos preliminares e gerais',
          'Trabalhos em terra',
          'Infra-estrutura',
          'Supra-estrutura',
          'Alvenaria / Vedação',
          'Coberta / Forros',
          'Impermeabilizações',
          'Instalacoes hidrosanitaria',
          'Louças e metais - instalação (materiais fornecidos pelo cliente)',
          'Instalacoes eletricas / telefônicas',
          'Esquadrias',
          'Revestimentos',
          'Pavimentacão',
          'Execução de muro',
          'Pintura geral',
          'Serviços complementares',
        ],
      },
      {
        name: 'Transporte',
        subTypes: [],
      },
      {
        name: 'Locação',
        subTypes: ['Escoras', 'Andaimes', 'Gerador', 'Martelete', 'Furadeira', 'Serra disco', 'Outros'],
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
    nfPercentage: '0,00',
    organizationPercentage: '0,00',
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

  constructor(private http: HttpClient, private socket: Socket, private wsService: WebSocketService) {}

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
          // TODO: Investigate if there is problem when update the list
          if (configs.length === 1) {
            configs[0].expenseConfig.contractExpenseTypes.push({ name: EXPENSE_TYPES.APORTE, subTypes: [] });
            configs[0].expenseConfig.contractExpenseTypes.push({ name: EXPENSE_TYPES.COMISSAO, subTypes: [] });
          }
          this.config$.next(configs as PlatformConfig[]);
          this._isDataLoaded$.next(true);
        });
      this.socket
        .fromEvent('dbchange')
        .pipe(takeUntil(this.destroy$))
        .subscribe((data: any) => this.wsService.handle(data, this.config$, 'platformconfigs'));
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
}
