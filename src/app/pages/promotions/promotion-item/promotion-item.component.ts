import { Component, OnInit, Input, Output, EventEmitter, ViewChild, OnDestroy } from '@angular/core';
import promotion_validation from 'app/shared/promotion-validation.json';
import { LocalDataSource, Ng2SmartTableComponent } from 'ng2-smart-table';
import { BehaviorSubject, Subject, Observable, of, forkJoin, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { UserService } from 'app/shared/services/user.service';
import { MetricsService } from 'app/shared/services/metrics.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { PromotionService } from 'app/shared/services/promotion.service';
import { Promotion } from '@models/promotion';
import { NbComponentStatus } from '@nebular/theme';
import { NgModel } from '@angular/forms';
import { cloneDeep } from 'lodash';
import { isPhone } from 'app/shared/utils';

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
  cashbackValue: string;
}

@Component({
  selector: 'ngx-promotion-item',
  templateUrl: './promotion-item.component.html',
  styleUrls: ['./promotion-item.component.scss'],
})
export class PromotionItemComponent implements OnInit, OnDestroy {
  private destroy$: Subject<void> = new Subject();

  @ViewChild(Ng2SmartTableComponent)
  table!: Ng2SmartTableComponent;
  @Input()
  iPromotion = new Promotion();
  @Output() submit: EventEmitter<void> = new EventEmitter();
  promotion = new Promotion();
  validation = promotion_validation as any;
  pTypes = Object.values(PROMOTION_STATOOS);
  pObjTypes = Object.values(RULE_OBJECTS);
  pOpTypes = Object.values(RULE_OPERATORS);
  promotionStatoos = PROMOTION_STATOOS;
  today = new Date();
  editing = false;
  userTableItems = new BehaviorSubject<UserTableItem[]>([]);

  source: LocalDataSource = new LocalDataSource();
  settings = {};

  isPhone = isPhone;

  constructor(
    private userService: UserService,
    private metricsService: MetricsService,
    private stringUtil: StringUtilService,
    private promotionService: PromotionService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    if (this.iPromotion._id != undefined) {
      this.editing = true;
      this.promotion = cloneDeep(this.iPromotion);
    } else {
      this.promotion = new Promotion();
      this.promotion.rules = [{ container: '', operator: '', value: '' }];
    }
    this.userTableItems.next(
      this.userService.getUsersList().map(
        (u): UserTableItem => ({
          name: this.userService.idToShortName(u),
          object: '',
          isValid: '',
          cashbackValue: '',
        })
      )
    );
    this.source.load(this.userTableItems.value);
    this.userTableItems.pipe(takeUntil(this.destroy$)).subscribe((tableItems) => this.source.load(tableItems));
    this.loadTableSettings();
  }

  registerPromotion(): void {
    if (this.editing) {
      this.promotionService.editPromotion(this.promotion);
    } else {
      this.promotionService.savePromotion(this.promotion);
      this.submit.emit();
    }
  }

  updateTableItems(): void {
    const { obj, cashback } = this.userService
      .getUsersList()
      .map((u) => ({
        obj: this.promotion.start && this.promotion.end ? this.objectRule(u._id) : of('0'),
        cashback: this.promotion.start && this.promotion.end ? this.cashbackRule(u._id) : of('0,00'),
      }))
      .reduce(
        (final, o) => {
          final.obj.push(o.obj);
          final.cashback.push(o.cashback);
          return final;
        },
        {
          obj: [] as Observable<string>[],
          cashback: [] as Observable<string>[],
        }
      );
    combineLatest([forkJoin(obj), forkJoin(cashback)]).subscribe(([objCount, cashbackValue]) => {
      const objArray = this.userTableItems.value;
      this.userTableItems.next(
        objArray.map((item, i) => {
          item.object = objCount[i];
          item.isValid = this.isValidRule(item.object) ? 'Sim' : 'Não';
          item.cashbackValue = cashbackValue[i];
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

  cashbackRule(uId: string): Observable<string> {
    return this.metricsService
      .cashbackValue(uId, this.promotion.cashback, this.promotion.start, this.promotion.end)
      .pipe(map((mI) => this.stringUtil.numberToMoney(mI.value)));
  }

  isValidRule(value: string): boolean {
    let isValid = false;
    switch (this.promotion.rules[0].operator) {
      case RULE_OPERATORS.IGUAL:
        isValid = this.stringUtil.moneyToNumber(value) == this.stringUtil.moneyToNumber(this.promotion.rules[0].value);
        break;
      case RULE_OPERATORS.MAIOR:
        isValid = this.stringUtil.moneyToNumber(value) > this.stringUtil.moneyToNumber(this.promotion.rules[0].value);
        break;
      case RULE_OPERATORS.MAIOR_IGUAL:
        isValid = this.stringUtil.moneyToNumber(value) >= this.stringUtil.moneyToNumber(this.promotion.rules[0].value);
        break;
      case RULE_OPERATORS.MENOR:
        isValid = this.stringUtil.moneyToNumber(value) < this.stringUtil.moneyToNumber(this.promotion.rules[0].value);
        break;
      case RULE_OPERATORS.MENOR_IGUAL:
        isValid = this.stringUtil.moneyToNumber(value) <= this.stringUtil.moneyToNumber(this.promotion.rules[0].value);
        break;
      default:
        break;
    }
    return isValid;
  }

  loadTableSettings(): void {
    this.settings = {
      mode: 'external',
      noDataMessage: 'Não encontramos nenhum associado para o filtro selecionado.',
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
          sortDirection: 'desc',
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
        cashbackValue: {
          title: 'Cashback',
          type: 'string',
          compareFunction: this.numberSort,
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

  validateStatus(model: NgModel): NbComponentStatus {
    if (model.touched || (model.value != '' && model.value != undefined))
      return model.invalid || model.value == '' ? 'danger' : 'success';
    return 'basic';
  }
}
