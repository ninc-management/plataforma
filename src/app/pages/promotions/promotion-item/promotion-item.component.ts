import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import * as promotion_validation from 'app/shared/promotion-validation.json';
import { UtilsService } from 'app/shared/services/utils.service';
import { LocalDataSource, Ng2SmartTableComponent } from 'ng2-smart-table';
import { UserService } from 'app/shared/services/user.service';

export enum PROMOTION_STATOOS {
  EM_ANDAMENTO = 'Em andamento',
  PROGRAMADA = 'Programada',
  CONCLUIDO = 'Concluído',
  INVALIDADA = 'Invalidada',
}

export enum RULE_OBJECTS {
  CONTRATOS = 'Contratos',
  ORCAMENTOS = 'Orçamentos',
}

export enum RULE_OPERATORS {
  IGUAL = '=',
  MAIOR = '>',
  MENOR = '<',
  MAIOR_IGUAL = '>=',
  MENOR_IGUAL = '<=',
}

@Component({
  selector: 'ngx-promotion-item',
  templateUrl: './promotion-item.component.html',
  styleUrls: ['./promotion-item.component.scss'],
})
export class PromotionItemComponent implements OnInit {
  @ViewChild(Ng2SmartTableComponent)
  table: Ng2SmartTableComponent;
  @Input()
  promotion: any = {};
  @Output() submit: EventEmitter<void> = new EventEmitter();
  validation = (promotion_validation as any).default;
  pTypes = Object.values(PROMOTION_STATOOS);
  pObjTypes = Object.values(RULE_OBJECTS);
  pOpTypes = Object.values(RULE_OPERATORS);
  promotionStatoos = PROMOTION_STATOOS;
  today = new Date();
  editing = false;

  source: LocalDataSource = new LocalDataSource();
  settings = {};

  constructor(private userService: UserService, public utils: UtilsService) {}

  ngOnInit(): void {
    if (this.promotion) {
      this.editing = true;
    } else {
      this.promotion = {
        created: this.today,
        lastUpdate: this.today,
        rules: [{ container: '', operator: '', value: '' }],
      };
    }
    this.source.load(this.userService.getUsersList());
    this.loadTableSettings();
  }

  registerPromotion(): void {
    if (!this.editing) this.submit.emit();
  }

  loadTableSettings(): void {
    this.settings = {
      mode: 'external',
      noDataMessage:
        'Não encontramos nenhum associado para o filtro selecionado.',
      add: {
        addButtonContent: '<i class="nb-plus"></i>',
        createButtonContent: '<i class="nb-checkmark"></i>',
        cancelButtonContent: '<i class="nb-close"></i>',
      },
      edit: {
        editButtonContent: '<i class="nb-edit"></i>',
        saveButtonContent: '<i class="nb-checkmark"></i>',
        cancelButtonContent: '<i class="nb-close"></i>',
      },
      delete: {
        deleteButtonContent: '<i class="nb-trash"></i>',
        confirmDelete: false,
      },
      actions: {
        columnTitle: 'Ações',
        add: false,
        edit: false,
        delete: false,
      },
      columns: {
        fullName: {
          title: 'Nome',
          type: 'string',
        },
        object: {
          title: this.promotion.rules[0].container,
          type: 'string',
        },
        isValid: {
          title: 'Contemplado',
          type: 'string',
        },
      },
    };
    if (this.table) this.table.settings = this.settings;
  }
}
