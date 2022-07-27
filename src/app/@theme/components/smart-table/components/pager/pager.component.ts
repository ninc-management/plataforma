import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { DataSource } from '../../lib/data-source/data-source';
import { StringUtilService } from 'app/shared/services/string-util.service';

type ReduceFunction = (...arg: any) => number;

@Component({
  selector: 'ng2-smart-table-pager',
  styleUrls: ['./pager.component.scss'],
  template: `
    <nav *ngIf="shouldShow()" class="ng2-smart-pagination-nav">
      <ul class="ng2-smart-pagination pagination">
        <li class="ng2-smart-page-item page-item" [ngClass]="{ disabled: getPage() == 1 }">
          <a
            class="ng2-smart-page-link page-link"
            href="#"
            (click)="getPage() == 1 ? false : paginate(1)"
            aria-label="First"
          >
            <span aria-hidden="true">&laquo;</span>
            <span class="sr-only">First</span>
          </a>
        </li>
        <li class="ng2-smart-page-item page-item" [ngClass]="{ disabled: getPage() == 1 }">
          <a
            class="ng2-smart-page-link page-link page-link-prev"
            href="#"
            (click)="getPage() == 1 ? false : prev()"
            aria-label="Prev"
          >
            <span aria-hidden="true">&lt;</span>
            <span class="sr-only">Prev</span>
          </a>
        </li>
        <li
          class="ng2-smart-page-item page-item"
          [ngClass]="{ active: getPage() == page }"
          *ngFor="let page of getPages()"
        >
          <span class="ng2-smart-page-link page-link" *ngIf="getPage() == page">
            {{ page }}
            <span class="sr-only">(current)</span>
          </span>
          <a class="ng2-smart-page-link page-link" href="#" (click)="paginate(page)" *ngIf="getPage() != page">
            {{ page }}
          </a>
        </li>

        <li class="ng2-smart-page-item page-item" [ngClass]="{ disabled: getPage() == getLast() }">
          <a
            class="ng2-smart-page-link page-link page-link-next"
            href="#"
            (click)="getPage() == getLast() ? false : next()"
            aria-label="Next"
          >
            <span aria-hidden="true">&gt;</span>
            <span class="sr-only">Next</span>
          </a>
        </li>

        <li class="ng2-smart-page-item page-item" [ngClass]="{ disabled: getPage() == getLast() }">
          <a
            class="ng2-smart-page-link page-link"
            href="#"
            (click)="getPage() == getLast() ? false : paginate(getLast())"
            aria-label="Last"
          >
            <span aria-hidden="true">&raquo;</span>
            <span class="sr-only">Last</span>
          </a>
        </li>
      </ul>
    </nav>

    <nav *ngIf="perPageSelect && perPageSelect.length > 0" class="ng2-smart-pagination-per-page">
      <label for="per-page">Per Page:</label>
      <select (change)="onChangePerPage($event)" [(ngModel)]="currentPerPage" id="per-page">
        <option *ngFor="let item of perPageSelect" [value]="item">{{ item }}</option>
      </select>
    </nav>

    <nav *ngIf="displaySum" class="ng2-smart-page-sum-value">
      <p>{{ pagerSumLabel }}: R$ {{ pageSum }}</p>
    </nav>
  `,
})
export class PagerComponent implements OnChanges, OnDestroy {
  @Input() source!: DataSource;
  @Input() displaySum: boolean = false;
  @Input() perPageSelect: any[] = [];
  @Input() pagerSumLabel: string = 'Total';
  @Input() reduceFunction: ReduceFunction = () => 0;

  @Output() changePage = new EventEmitter<any>();

  currentPerPage: any;
  private destroy$ = new Subject<void>();
  protected pages: Array<any> = [];
  protected page: number = 0;
  protected count: number = 0;
  protected perPage: number = 0;
  pageSum: string = '0.0';

  constructor(private stringUtil: StringUtilService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.source) {
      this.source
        .onChanged()
        .pipe(takeUntil(this.destroy$))
        .subscribe((dataChanges) => {
          this.page = this.source.getPaging().page;
          this.perPage = this.source.getPaging().perPage;
          this.currentPerPage = this.perPage;
          this.count = this.source.count();
          if (this.isPageOutOfBounce()) {
            this.source.setPage(--this.page);
          }

          this.processPageChange(dataChanges);
          this.initPages();
          if (this.displaySum)
            this.pageSum = this.stringUtil.numberToMoney(dataChanges.elements.reduce(this.reduceFunction, 0));
        });
    }
  }

  /**
   * We change the page here depending on the action performed against data source
   * if a new element was added to the end of the table - then change the page to the last
   * if a new element was added to the beginning of the table - then to the first page
   * @param changes
   */
  processPageChange(changes: any) {
    if (changes['action'] === 'prepend') {
      this.source.setPage(1);
    }
    if (changes['action'] === 'append') {
      this.source.setPage(this.getLast());
    }
  }

  shouldShow(): boolean {
    return this.displaySum || this.source.count() > this.perPage;
  }

  paginate(page: number): boolean {
    this.source.setPage(page);
    this.page = page;
    this.changePage.emit({ page });
    return false;
  }

  next(): boolean {
    return this.paginate(this.getPage() + 1);
  }

  prev(): boolean {
    return this.paginate(this.getPage() - 1);
  }

  getPage(): number {
    return this.page;
  }

  getPages(): Array<any> {
    return this.pages;
  }

  getLast(): number {
    return Math.ceil(this.count / this.perPage);
  }

  isPageOutOfBounce(): boolean {
    return this.page * this.perPage >= this.count + this.perPage && this.page > 1;
  }

  initPages() {
    const pagesCount = this.getLast();
    let showPagesCount = 4;
    showPagesCount = pagesCount < showPagesCount ? pagesCount : showPagesCount;
    this.pages = [];

    if (this.shouldShow()) {
      let middleOne = Math.ceil(showPagesCount / 2);
      middleOne = this.page >= middleOne ? this.page : middleOne;

      let lastOne = middleOne + Math.floor(showPagesCount / 2);
      lastOne = lastOne >= pagesCount ? pagesCount : lastOne;

      const firstOne = lastOne - showPagesCount + 1;

      for (let i = firstOne; i <= lastOne; i++) {
        this.pages.push(i);
      }
    }
  }

  onChangePerPage(event: any) {
    if (this.currentPerPage) {
      if (typeof this.currentPerPage === 'string' && this.currentPerPage.toLowerCase() === 'all') {
        this.source.getPaging().perPage = null;
      } else {
        this.source.getPaging().perPage = this.currentPerPage * 1;
        this.source.refresh();
      }
      this.initPages();
    }
  }
}
