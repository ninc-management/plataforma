import { Component, OnInit, OnDestroy } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { Subject } from 'rxjs';
import { LocalDataSource } from 'ng2-smart-table';
import { takeUntil } from 'rxjs/operators';
import { UtilsService } from 'app/shared/services/utils.service';
import { PromotionService } from 'app/shared/services/promotion.service';
import { PromotionDialogComponent } from './promotion-dialog/promotion-dialog.component';
import { Promotion } from '../../../../backend/src/models/promotion';

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
        return promotion.name
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase());
      });
    return this.promotions.sort((a, b) => {
      return a.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '') <
        b.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        ? -1
        : 1;
    });
  }

  settings = {
    mode: 'external',
    noDataMessage:
      'Não encontramos nenhuma promoção para o filtro selecionado.',
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

  promotionDialog(event: { data?: any }): void {
    this.dialogService.open(PromotionDialogComponent, {
      context: {
        title: event.data
          ? this.utils.isPhone()
            ? 'EDIÇÃO'
            : 'EDIÇÃO DE PROMOÇÃO'
          : 'CADASTRO DE PROMOÇÃO',
        promotion: event.data,
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }
}
