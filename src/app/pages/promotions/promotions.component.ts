import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { combineLatest, Subject } from 'rxjs';
import { skipWhile, takeUntil } from 'rxjs/operators';

import { PromotionDialogComponent } from './promotion-dialog/promotion-dialog.component';
import { PROMOTION_STATOOS } from './promotion-item/promotion-item.component';
import { LocalDataSource } from 'app/@theme/components/smart-table/lib/data-source/local/local.data-source';
import { PromotionService } from 'app/shared/services/promotion.service';
import { isPhone, nameSort } from 'app/shared/utils';

import { Promotion } from '@models/promotion';

@Component({
  selector: 'ngx-promotions',
  templateUrl: './promotions.component.html',
  styleUrls: ['./promotions.component.scss'],
})
export class PromotionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  promotions: Promotion[] = [];
  source: LocalDataSource = new LocalDataSource();
  isDataLoaded = false;
  searchQuery = '';
  get filtredPromotions(): Promotion[] {
    if (this.searchQuery !== '')
      return this.promotions.filter((promotion) => {
        return promotion.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      });
    return this.promotions.sort((a, b) => {
      return nameSort(1, a.name, b.name);
    });
  }

  settings = {
    mode: 'external',
    noDataMessage: 'Não encontramos nenhuma promoção para o filtro selecionado.',
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
      deleteButtonContent: '<i class="fa fa-dollar-sign"></i>',
      confirmDelete: false,
    },
    actions: {
      columnTitle: 'Ações',
      add: true,
      edit: true,
      delete: false,
    },
    columns: {
      name: {
        title: 'Nome',
        type: 'string',
        width: '80%',
      },
      status: {
        title: 'Status',
        type: 'string',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: Object.values(PROMOTION_STATOOS).map((status) => ({
              value: status,
              title: status,
            })),
          },
        },
      },
    },
  };

  isPhone = isPhone;

  constructor(private dialogService: NbDialogService, private promotionService: PromotionService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    combineLatest([this.promotionService.getPromotions(), this.promotionService.isDataLoaded$])
      .pipe(
        takeUntil(this.destroy$),
        skipWhile(([, promotionLoaded]) => !promotionLoaded)
      )
      .subscribe(([promotions]) => {
        this.promotions = promotions;
        this.source.load(this.promotions);
        this.isDataLoaded = true;
      });
  }

  promotionDialog(event: { data?: Promotion }): void {
    this.dialogService.open(PromotionDialogComponent, {
      context: {
        title: event.data ? (isPhone() ? 'EDIÇÃO' : 'EDIÇÃO DE PROMOÇÃO') : 'CADASTRO DE PROMOÇÃO',
        promotion: event.data ? event.data : new Promotion(),
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
