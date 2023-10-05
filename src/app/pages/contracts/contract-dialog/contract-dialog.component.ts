import { HttpClient } from '@angular/common/http';
import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { NB_DOCUMENT, NbDialogRef, NbDialogService } from '@nebular/theme';
import { cloneDeep } from 'lodash';
import { combineLatest, map, skipWhile, take, takeUntil } from 'rxjs';

import { PdfService } from 'app/pages/invoices/pdf.service';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { ConfigService } from 'app/shared/services/config.service';
import { CONTRACT_STATOOS, ContractService } from 'app/shared/services/contract.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { OneDriveService } from 'app/shared/services/onedrive.service';
import { UserService } from 'app/shared/services/user.service';
import { moneyToNumber } from 'app/shared/string-utils';
import { codeSort, idToProperty, isPhone, tooltipTriggers } from 'app/shared/utils';

import { Contract } from '@models/contract';
import { PlatformConfig } from '@models/platformConfig';

export enum COMPONENT_TYPES {
  CONTRACT,
  PAYMENT,
  RECEIPT,
  EXPENSE,
}

@Component({
  selector: 'ngx-contract-dialog',
  templateUrl: './contract-dialog.component.html',
  styleUrls: ['./contract-dialog.component.scss'],
})
export class ContractDialogComponent extends BaseDialogComponent implements OnInit {
  @Input() title = '';
  @Input() contract = new Contract();
  @Input() paymentIndex?: number;
  @Input() receiptIndex?: number;
  @Input() expenseIndex?: number;
  @Input() componentType = COMPONENT_TYPES.RECEIPT;
  isPayable = true;
  hasBalance = true;
  types = COMPONENT_TYPES;
  onedriveUrl = '';
  availableContracts: Contract[] = [];
  config: PlatformConfig = new PlatformConfig();
  creatingOneDriveFolder: boolean = false;

  isPhone = isPhone;
  idToProperty = idToProperty;
  tooltipTriggers = tooltipTriggers;

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ContractDialogComponent>,
    protected invoiceService: InvoiceService,
    private userService: UserService,
    private contractService: ContractService,
    private onedrive: OneDriveService,
    private pdf: PdfService,
    private http: HttpClient,
    private dialogService: NbDialogService,
    private configService: ConfigService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    combineLatest([this.configService.isDataLoaded$, this.configService.getConfig()])
      .pipe(
        skipWhile(([configLoaded, _]) => !configLoaded),
        takeUntil(this.destroy$)
      )
      .subscribe(([_, config]) => {
        this.config = config[0];
      });
    this.isPayable = this.contract.total != undefined && this.contract.receipts.length < +this.contract.total;
    this.hasBalance = moneyToNumber(this.contract.locals.balance) > 0;
    if (this.componentType == COMPONENT_TYPES.CONTRACT && this.config.oneDriveConfig.isActive) this.getOnedriveUrl();
    else if (this.contract._id === undefined) {
      this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
        this.contractService
          .getContracts()
          .pipe(
            map((contracts) => {
              contracts = contracts.filter(
                (contract) =>
                  contract.invoice &&
                  (contract.status == CONTRACT_STATOOS.EM_ANDAMENTO || contract.status == CONTRACT_STATOOS.A_RECEBER) &&
                  (this.invoiceService.isInvoiceAuthor(contract.invoice, user) ||
                    this.invoiceService.isInvoiceMember(contract.invoice, user))
              );
              contracts.map((contract) => this.contractService.fillContract(contract));
              return contracts.sort((a, b) =>
                codeSort(
                  -1,
                  idToProperty(a.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code'),
                  idToProperty(b.invoice, this.invoiceService.idToInvoice.bind(this.invoiceService), 'code')
                )
              );
            })
          )
          .subscribe((contracts) => {
            if (contracts.length === 0) this.isPayable = this.hasBalance = false;
            else {
              switch (this.componentType) {
                case COMPONENT_TYPES.RECEIPT:
                  this.availableContracts = contracts.filter(
                    (contract) => contract.total !== contract.receipts.length.toString()
                  );
                  this.isPayable = this.availableContracts.length !== 0;
                  break;
                case COMPONENT_TYPES.PAYMENT:
                  this.availableContracts = contracts.filter((contract) => moneyToNumber(contract.locals.balance) > 0);
                  this.hasBalance = this.availableContracts.length !== 0;
                  break;
                case COMPONENT_TYPES.EXPENSE:
                  this.availableContracts = contracts.filter((contract) => moneyToNumber(contract.locals.balance) > 0);
                  this.hasBalance = this.availableContracts.length !== 0;
                  break;
                default:
                  this.availableContracts = contracts;
                  break;
              }
            }
          });
      });
    }
  }

  dismiss(): void {
    if (this.isFormDirty.value) {
      this.dialogService
        .open(ConfirmationDialogComponent, {
          context: {
            question: 'Deseja descartar as alterações feitas?',
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        })
        .onClose.pipe(take(1))
        .subscribe((response: boolean) => {
          if (response) {
            super.dismiss();
          }
        });
    } else {
      super.dismiss();
    }
  }

  getOnedriveUrl(): void {
    if (this.contract.invoice) {
      const contract = cloneDeep(this.contract);
      contract.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      this.onedrive.webUrl(contract).subscribe(
        (url) => {
          this.onedriveUrl = url;
          this.creatingOneDriveFolder = false;
        },
        (error) => {
          this.onedriveUrl = '';
        }
      );
    }
  }

  addToOnedrive(): void {
    this.creatingOneDriveFolder = true;
    if (this.contract.invoice)
      this.onedrive
        .copyModelFolder(this.invoiceService.idToInvoice(this.contract.invoice))
        .pipe(take(1))
        .subscribe((isComplete) => {
          if (isComplete)
            setTimeout(() => {
              this.getOnedriveUrl();
            }, 4000); // Tempo para a cópia da pasta ser realizada
        });
  }

  openPDFnewtab(): void {
    this.http
      .post('/api/public/metric/all/', {})
      .pipe(take(1))
      .subscribe((metrics: any) => {
        if (this.contract.invoice)
          this.pdf.generate(this.invoiceService.idToInvoice(this.contract.invoice), metrics, false, true);
      });
  }
}
