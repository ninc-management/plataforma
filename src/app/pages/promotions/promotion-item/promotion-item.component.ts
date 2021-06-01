import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import * as promotion_validation from 'app/shared/promotion-validation.json';
import { UtilsService } from 'app/shared/services/utils.service';
import { LocalDataSource, Ng2SmartTableComponent } from 'ng2-smart-table';
import { UserService } from 'app/shared/services/user.service';
import { MetricsService } from 'app/shared/services/metrics.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { BehaviorSubject, Subject, Observable, of, forkJoin } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

export enum PROMOTION_STATOOS {
  EM_ANDAMENTO = 'Em andamento',
  PROGRAMADA = 'Programada',
  CONCLUIDO = 'Concluído',
  INVALIDADA = 'Invalidada',
}

export enum RULE_OBJECTS {
  CONTRATOS = 'Contratos',
  VALOR_RECEBIDO = 'Valor Recebido',
}

export enum RULE_OPERATORS {
  IGUAL = '=',
  MAIOR = '>',
  MENOR = '<',
  MAIOR_IGUAL = '>=',
  MENOR_IGUAL = '<=',
}

interface UserTableItem {
  name: string;
  object: string;
  isValid: string;
}

@Component({
  selector: 'ngx-promotion-item',
  templateUrl: './promotion-item.component.html',
  styleUrls: ['./promotion-item.component.scss'],
})
export class PromotionItemComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject();

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
  userTableItems = new BehaviorSubject<UserTableItem[]>([]);

  source: LocalDataSource = new LocalDataSource();
  settings = {};

  constructor(
    private userService: UserService,
    private metricsService: MetricsService,
    private stringUtil: StringUtilService,
    public utils: UtilsService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
    this.userTableItems.next(
      this.userService.getUsersList().map(
        (u): UserTableItem => ({
          name: this.userService.idToShortName(u),
          object: '',
          isValid: '',
        })
      )
    );
    this.source.load(this.userTableItems.value);
    this.userTableItems
      .pipe(takeUntil(this.destroy$))
      .subscribe((tableItems) => this.source.load(tableItems));
    this.loadTableSettings();
  }

  registerPromotion(): void {
    if (!this.editing) this.submit.emit();
  }

  updateTableItems(): void {
    const tmp = this.userService
      .getUsersList()
      .map((u) => this.objectRule(u._id));
    forkJoin(...tmp).subscribe((objCount: string[]) => {
      const objArray = this.userTableItems.value;
      this.userTableItems.next(
        objArray.map((item, i) => {
          item.object = objCount[i];
          item.isValid = this.isValidRule(item.object) ? 'Sim' : 'Não';
          return item;
        })
      );
    });
  }

  objectRule(uId: string): Observable<string> {
    let objCount = of('0');
    switch (this.promotion.rules[0].container) {
      case RULE_OBJECTS.CONTRATOS:
        objCount = this.metricsService
          .contracts(uId, this.promotion.start, this.promotion.end)
          .pipe(map((mI) => mI.count.toString()));
        break;
      case RULE_OBJECTS.VALOR_RECEBIDO:
        objCount = this.metricsService
          .receivedValue(uId, this.promotion.start, this.promotion.end)
          .pipe(map((mI) => this.stringUtil.numberToMoney(mI.value)));
        break;
      default:
        break;
    }
    return objCount;
  }

  isValidRule(value: string): boolean {
    let isValid = false;
    switch (this.promotion.rules[0].operator) {
      case RULE_OPERATORS.IGUAL:
        isValid =
          this.stringUtil.moneyToNumber(value) ==
          this.stringUtil.moneyToNumber(this.promotion.rules[0].value);
        break;
      case RULE_OPERATORS.MAIOR:
        isValid =
          this.stringUtil.moneyToNumber(value) >
          this.stringUtil.moneyToNumber(this.promotion.rules[0].value);
        break;
      case RULE_OPERATORS.MAIOR_IGUAL:
        isValid =
          this.stringUtil.moneyToNumber(value) >=
          this.stringUtil.moneyToNumber(this.promotion.rules[0].value);
        break;
      case RULE_OPERATORS.MENOR:
        isValid =
          this.stringUtil.moneyToNumber(value) <
          this.stringUtil.moneyToNumber(this.promotion.rules[0].value);
        break;
      case RULE_OPERATORS.MENOR_IGUAL:
        isValid =
          this.stringUtil.moneyToNumber(value) <=
          this.stringUtil.moneyToNumber(this.promotion.rules[0].value);
        break;
      default:
        break;
    }
    return isValid;
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
        name: {
          title: 'Nome',
          type: 'string',
        },
        object: {
          title: this.promotion.rules[0].container,
          type: 'string',
          compareFunction: this.numberSort,
        },
        isValid: {
          title: 'Contemplado',
          type: 'string',
          filter: {
            type: 'list',
            config: {
              selectText: 'Todos',
              list: [
                { value: 'Sim', title: 'Sim' },
                { value: 'Não', title: 'Não' },
              ],
            },
          },
        },
      },
    };
    if (this.table) this.table.settings = this.settings;
    this.updateTableItems();
  }

  numberSort(direction: number, a: string, b: string): number {
    const first = +a.replace(/[,.]/g, '');
    const second = +b.replace(/[,.]/g, '');

    if (first < second) {
      return -1 * direction;
    }
    if (first > second) {
      return direction;
    }
    return 0;
  }
}
