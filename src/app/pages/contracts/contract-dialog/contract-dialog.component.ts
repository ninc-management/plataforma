import { Component, OnInit, Input, Inject, Optional } from '@angular/core';
import { NbDialogRef, NB_DOCUMENT } from '@nebular/theme';
import { cloneDeep } from 'lodash';
import { map, take } from 'rxjs/operators';
import { OnedriveService } from 'app/shared/services/onedrive.service';
import { UtilsService } from 'app/shared/services/utils.service';
import { InvoiceService } from 'app/shared/services/invoice.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { PdfService } from 'app/pages/invoices/pdf.service';
import { UserService } from 'app/shared/services/user.service';
import { ContractService, CONTRACT_STATOOS } from 'app/shared/services/contract.service';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { Contract } from '@models/contract';

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

  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<ContractDialogComponent>,
    protected invoiceService: InvoiceService,
    private stringUtil: StringUtilService,
    private userService: UserService,
    private contractService: ContractService,
    private onedrive: OnedriveService,
    private pdf: PdfService,
    public utils: UtilsService
  ) {
    super(derivedDocument, derivedRef);
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.isPayable = this.contract.total != undefined && this.contract.receipts.length < +this.contract.total;
    this.hasBalance = this.stringUtil.moneyToNumber(this.contract.balance) > 0;
    if (this.componentType == COMPONENT_TYPES.CONTRACT) this.getOnedriveUrl();
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
              contracts.map((contract) => {
                if (contract.invoice) {
                  const nf = this.utils.nfPercentage(contract);
                  const nortan = this.utils.nortanPercentage(contract);
                  contract.invoice = this.invoiceService.idToInvoice(contract.invoice);
                  contract.value = contract.invoice.value;
                  contract.code = contract.invoice.code;
                  contract.balance = this.contractService.balance(contract);
                  contract.liquid = this.contractService.toNetValue(
                    this.contractService.subtractComissions(
                      this.stringUtil.removePercentage(contract.value, contract.ISS),
                      contract
                    ),
                    this.utils.nfPercentage(contract),
                    this.utils.nortanPercentage(contract)
                  );
                  const paid = this.contractService.paidValue(contract);
                  contract.notPaid = this.stringUtil.numberToMoney(
                    this.stringUtil.moneyToNumber(this.contractService.toNetValue(this.contract.value, nf, nortan)) -
                      this.stringUtil.moneyToNumber(paid)
                  );
                  const invoice = this.invoiceService.idToInvoice(contract.invoice);
                  if (invoice.author) {
                    const managerPicture = this.userService.idToUser(invoice.author).profilePicture;
                    if (managerPicture) contract.managerPicture = managerPicture;
                  }
                }
                return contract;
              });
              return contracts.sort((a, b) => this.utils.codeSort(-1, a.code, b.code));
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
                  this.availableContracts = contracts.filter(
                    (contract) => this.stringUtil.moneyToNumber(contract.balance) > 0
                  );
                  this.hasBalance = this.availableContracts.length !== 0;
                  break;
                case COMPONENT_TYPES.EXPENSE:
                  this.availableContracts = contracts.filter(
                    (contract) => this.stringUtil.moneyToNumber(contract.balance) > 0
                  );
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
    super.dismiss();
  }

  getOnedriveUrl(): void {
    if (this.contract.invoice) {
      const contract = cloneDeep(this.contract);
      contract.invoice = this.invoiceService.idToInvoice(this.contract.invoice);
      this.onedrive.webUrl(contract).subscribe(
        (url) => {
          this.onedriveUrl = url;
        },
        (error) => {
          this.onedriveUrl = '';
        }
      );
    }
  }

  addToOnedrive(): void {
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
    if (this.contract.invoice) this.pdf.generate(this.invoiceService.idToInvoice(this.contract.invoice), false, true);
  }
}
