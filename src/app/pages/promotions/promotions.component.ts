import { Component, OnInit, OnDestroy } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { LocalDataSource } from 'ng2-smart-table';
import { takeUntil } from 'rxjs/operators';
import { UtilsService } from 'app/shared/services/utils.service';
import { PromotionService } from 'app/shared/services/promotion.service';
import { PromotionDialogComponent } from './promotion-dialog/promotion-dialog.component';
import { Promotion } from '@models/promotion';
import { PROMOTION_STATOOS } from './promotion-item/promotion-item.component';

@Component({
  selector: 'ngx-promotions',
  templateUrl: './promotions.component.html',
  styleUrls: ['./promotions.component.scss'],
})
export class PromotionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  promotions: Promotion[] = [];
  source: LocalDataSource = new LocalDataSource();

  searchQuery = '';
  get filtredPromotions(): Promotion[] {
    if (this.searchQuery !== '')
      return this.promotions.filter((promotion) => {
        return promotion.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      });
    return this.promotions.sort((a, b) => {
      return this.utils.nameSort(1, a.name, b.name);
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

  constructor(
    private dialogService: NbDialogService,
    private promotionService: PromotionService,
    public utils: UtilsService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.promotionService
      .getPromotions()
      .pipe(takeUntil(this.destroy$))
      .subscribe((promotions) => {
        this.promotions = promotions;
        this.source.load(this.promotions);
      });
  }

  promotionDialog(event: { data?: Promotion }): void {
    this.dialogService.open(PromotionDialogComponent, {
      context: {
        title: event.data ? (this.utils.isPhone() ? 'EDIÇÃO' : 'EDIÇÃO DE PROMOÇÃO') : 'CADASTRO DE PROMOÇÃO',
        promotion: event.data ? event.data : new Promotion(),
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
