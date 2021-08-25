import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  Input,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Inject,
  Optional,
} from '@angular/core';
import { CompleterService, CompleterData } from 'ng2-completer';
import { NbDialogRef, NbDialogService, NB_DOCUMENT } from '@nebular/theme';
import { NbAccessChecker } from '@nebular/security';
import { take, takeUntil } from 'rxjs/operators';
import { Subject, BehaviorSubject } from 'rxjs';
import { cloneDeep } from 'lodash';
import { ContractorDialogComponent } from '../../contractors/contractor-dialog/contractor-dialog.component';
import { BaseDialogComponent } from 'app/shared/components/base-dialog/base-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { DepartmentService } from 'app/shared/services/department.service';
import {
  InvoiceService,
  INVOICE_STATOOS,
} from 'app/shared/services/invoice.service';
import { ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { UserService } from 'app/shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
import {
  Invoice,
  InvoiceTeamMember,
  InvoiceMaterial,
  InvoiceProduct,
  InvoiceStage,
} from '@models/invoice';
import { User } from '@models/user';
import { Contractor } from '@models/contractor';
import * as invoice_validation from 'app/shared/invoice-validation.json';
import { BrMaskDirective } from 'app/shared/directives/br-mask.directive';

@Component({
  selector: 'ngx-invoice-item',
  templateUrl: './invoice-item.component.html',
  styleUrls: ['./invoice-item.component.scss'],
})
export class InvoiceItemComponent implements OnInit, OnDestroy {
  @Input() iInvoice = new Invoice();
  @Input() tempInvoice = new Invoice();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Output() submit = new EventEmitter<void>();
  teamMember: InvoiceTeamMember = {
    user: undefined,
    coordination: '',
  };
  options = {
    aep: '',
    aee: '',
    aec: '',
    important: '',
    valueType: '$',
    stageValueType: '$',
    material: {
      name: '',
      amount: '',
      value: '',
      total: '0,00',
    } as InvoiceMaterial,
    product: {
      value: '',
      amount: '',
      total: '0,00',
      name: '',
      subproducts: [] as string[],
    } as InvoiceProduct,
    stage: {
      value: '',
      name: '',
    } as InvoiceStage,
    total: '0',
    subtotal: '0',
    discountPercentage: '',
    stageTotal: '0',
    materialTotal: '0,00',
    materialTotalWithDiscount: '0,00',
    lastValue: '',
    lastProducts: [] as InvoiceProduct[],
    lastStages: [] as InvoiceStage[],
    netValue: '0,00',
  };
  destroy$ = new Subject<void>();
  editing = false;
  today = new Date();
  invoiceNumber = 0;
  revision = 0;
  validation = (invoice_validation as any).default;
  oldStatus: INVOICE_STATOOS = INVOICE_STATOOS.EM_ANALISE;

  contractorSearch = '';
  contractorData: CompleterData = this.completerService.local([]);
  userSearch = '';
  userData: CompleterData = this.completerService.local([]);
  authorSearch = '';
  authorData: CompleterData = this.completerService.local([]);

  DEPARTMENTS: string[] = [];
  COORDINATIONS: string[] = [];
  ALL_COORDINATIONS: string[] = [];
  USER_COORDINATIONS: string[] = [];
  tStatus = INVOICE_STATOOS;
  STATOOS = Object.values(INVOICE_STATOOS);

  constructor(
    private dialogService: NbDialogService,
    private invoiceService: InvoiceService,
    private contractService: ContractService,
    private completerService: CompleterService,
    public departmentService: DepartmentService,
    public stringUtil: StringUtilService,
    public utils: UtilsService,
    public userService: UserService,
    public contractorService: ContractorService,
    public accessChecker: NbAccessChecker,
    private brMask: BrMaskDirective
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    if (this.iInvoice) {
      this.editing = this.tempInvoice.model == undefined;
      if (!this.editing) {
        this.tempInvoice.created = new Date();
        this.tempInvoice.lastUpdate = new Date();
      }
      this.COORDINATIONS = this.departmentService.buildCoordinationsList(
        this.tempInvoice.department
      );
      this.tempInvoice.department = this.departmentService.composedName(
        this.tempInvoice.department
      );
      this.contractorSearch = this.tempInvoice.contractor
        ? this.contractorService.idToName(this.tempInvoice.contractor)
        : '';
      this.revision = +this.tempInvoice.code?.slice(
        this.tempInvoice.code.length - 2
      );
      this.revision += 1;
      this.oldStatus = this.tempInvoice.status as INVOICE_STATOOS;
      if (this.tempInvoice.materialListType == undefined)
        this.tempInvoice.materialListType = '1';
      if (this.tempInvoice.productListType == undefined)
        this.tempInvoice.productListType = '1';
      if (this.tempInvoice.invoiceType == undefined)
        this.tempInvoice.invoiceType = 'projeto';
      this.updateDiscountPercentage();
      this.updateLastValues();
      this.updateDependentValues(this.tempInvoice.products, 'product');
      this.updateDependentValues(this.tempInvoice.stages, 'stage');
      this.updateTotal('material');
      this.updateNetValue();
    } else {
      this.tempInvoice = new Invoice();
      this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
        this.tempInvoice.author = user;
      });
    }
    if (this.tempInvoice.contactPlural == undefined)
      this.tempInvoice.contactPlural = false;
    if (this.tempInvoice.peep == undefined)
      this.tempInvoice.peep =
        '20 dias úteis para o primeiro estudo preliminar, mais 15 dias úteis para cada pedido de alteração feito pelo cliente';
    if (this.tempInvoice.dep == undefined)
      this.tempInvoice.dep =
        'Serão feitas reunião inicial para identificação das necessidades e uma reunião para cada alteração da proposta. Serão apresentadas imagens em 3D para melhor entendimento do projeto.\nToda e qualquer alteração é feita nessa etapa.';
    if (this.tempInvoice.peee == undefined)
      this.tempInvoice.peee =
        'início após aprovação da proposta preliminar, 30 dias úteis para finalização';
    if (this.tempInvoice.dee == undefined)
      this.tempInvoice.dee =
        'Os itens acima compõem o produto final a ser entregue contando com todas as informações técnicas necessárias e suficientes para a realização da obra.';
    if (this.tempInvoice.peec == undefined)
      this.tempInvoice.peec =
        'será acompanhando o processo de aprovação do projeto junto ao órgão municipal competente';
    if (this.tempInvoice.dec == undefined)
      this.tempInvoice.dec =
        'Serão feitas 3 visitas à obra para verificar o andamento do trabalho conforme projeto.';
    if (this.tempInvoice.importants.length == 0)
      this.tempInvoice.importants = [
        'O  pagamento pode ser feito em dinheiro, via depósito ou transferência, podendo ser combinado entre as partes no momento da assinatura do contrato',
        'Está incluso o registro de responsabilidade técnica, necessário para aprovação do projeto',
        'Não estão inclusas taxas recolhidas junto à Prefeitura Municipal ou outras taxas que sejam necessárias para a aprovação e execução do projeto, sendo de responsabilidade do cliente',
        'O produto final será entregue por e-mail em PDF para o cliente + 02 (duas) cópias impressas',
        'O orçamento é baseado nas necessidades iniciais do cliente, caso durante o projeto surjam novas demandas, será tratado entre o prestador e serviço e o contratante',
      ];
    this.invoiceService
      .invoicesSize()
      .pipe(take(2))
      .subscribe((size: number) => {
        this.invoiceNumber = size;
        this.updateCode();
      });
    this.contractorService
      .getContractors()
      .pipe(takeUntil(this.destroy$))
      .subscribe((contractors) => {
        this.contractorData = this.completerService.local(
          contractors,
          'fullName,document',
          'fullName'
        );
      });

    this.userData = this.completerService
      .local(
        this.userService.getUsersList().filter((user) => {
          if (this.tempInvoice.author)
            return (
              user._id != this.userService.idToUser(this.tempInvoice.author)._id
            );
          return false;
        }),
        'fullName',
        'fullName'
      )
      .imageField('profilePicture');

    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.accessChecker
        .isGranted('aer', 'invoice-author')
        .pipe(take(1))
        .subscribe((isGranted) => {
          if (isGranted && user.AER) {
            const u = cloneDeep(user);
            if (u.AER) {
              u.AER.unshift(u._id);
              this.authorData = this.completerService
                .local(
                  u.AER.filter((u): u is User | string => u != undefined).map(
                    (u) => this.userService.idToUser(u)
                  ),
                  'fullName',
                  'fullName'
                )
                .imageField('profilePicture');
              if (
                this.tempInvoice.author &&
                u.AER.includes(
                  this.userService.idToUser(this.tempInvoice.author)._id
                )
              )
                this.authorSearch = this.userService.idToName(
                  this.tempInvoice.author
                );
              else {
                this.authorSearch = '';
                this.tempInvoice.author = undefined;
              }
            }
          }
        });
    });

    this.DEPARTMENTS = this.departmentService.buildDepartmentList();
    this.ALL_COORDINATIONS = this.departmentService.buildAllCoordinationsList();
  }

  registerInvoice(): void {
    const department = this.tempInvoice.department;
    this.tempInvoice.department = this.departmentService.extractAbreviation(
      this.tempInvoice.department
    );
    this.tempInvoice.lastUpdate = new Date();
    if (this.editing) {
      this.updateRevision();
      if (this.oldStatus !== this.tempInvoice.status) {
        const lastStatusIndex = this.tempInvoice.statusHistory.length - 1;
        this.tempInvoice.statusHistory[lastStatusIndex].end =
          this.tempInvoice.lastUpdate;
        this.tempInvoice.statusHistory.push({
          status: this.tempInvoice.status,
          start: this.tempInvoice.lastUpdate,
        });
      }
      this.invoiceService.editInvoice(this.tempInvoice);
      if (this.oldStatus !== this.tempInvoice.status) {
        if (this.tempInvoice.status === INVOICE_STATOOS.FECHADO)
          this.contractService.saveContract(this.tempInvoice);
      }
      this.tempInvoice.contractorName = this.tempInvoice.contractor
        ? this.contractorService.idToName(this.tempInvoice.contractor)
        : '';
      this.iInvoice = cloneDeep(this.tempInvoice);
      this.tempInvoice.department = department;
    } else {
      this.tempInvoice.statusHistory.push({
        status: this.tempInvoice.status,
        start: this.tempInvoice.created,
      });
      this.invoiceService.saveInvoice(this.tempInvoice);
      this.submit.emit();
    }
  }

  updateLastValues(): void {
    this.options.lastValue = this.tempInvoice.value
      ? this.tempInvoice.value.slice()
      : '0';
    this.options.lastProducts = cloneDeep(this.tempInvoice.products);
    this.options.lastStages = cloneDeep(this.tempInvoice.stages);
  }

  updateDependentValues(array: any[], type: 'stage' | 'product'): void {
    if (type === 'product' && this.tempInvoice.productListType == '2') return;
    if (this.tempInvoice.value !== '0') {
      const lastArray =
        type == 'stage' ? this.options.lastStages : this.options.lastProducts;
      array.map((item, index) => {
        const p = this.stringUtil
          .toPercentage(lastArray[index].value, this.options.lastValue, 20)
          .slice(0, -1);
        item.value = this.stringUtil.applyPercentage(this.tempInvoice.value, p);

        item.percentage = p;

        return item;
      });
    }
    this.updateTotal(type);
  }

  onDepartmentChange(): void {
    this.updateCode();
    this.updateCoordination();
  }

  updateCoordination(): void {
    this.tempInvoice.coordination = '';
    this.COORDINATIONS = this.departmentService.buildCoordinationsList(
      this.departmentService.extractAbreviation(this.tempInvoice.department)
    );
  }

  addColaborator(): void {
    if (this.tempInvoice.team) {
      this.tempInvoice.team.push(cloneDeep(this.teamMember));
      this.userSearch = '';
      this.USER_COORDINATIONS = this.updateUserCoordinations();
    }
  }

  updateUserCoordinations(): string[] {
    this.teamMember.coordination = '';
    if (this.teamMember.user)
      return this.departmentService.userCoordinations(this.teamMember.user);
    return [];
  }

  /* eslint-disable @typescript-eslint/indent */
  updateCode(): void {
    if (!this.editing) {
      this.tempInvoice.code =
        'ORC-' +
        this.invoiceNumber +
        '/' +
        new Date().getFullYear() +
        '-NRT/' +
        (this.tempInvoice.department
          ? this.departmentService.extractAbreviation(
              this.tempInvoice.department
            )
          : '') +
        '-00';
    }
  }
  /* eslint-enable @typescript-eslint/indent */

  updateRevision(): void {
    this.tempInvoice.code =
      this.tempInvoice.code.slice(0, this.tempInvoice.code.length - 2) +
      this.revision.toString().padStart(2, '0');
  }

  addContractor(): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(ContractorDialogComponent, {
        context: {
          title: 'CADASTRO DE CLIENTE',
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(() => this.isDialogBlocked.next(false));
  }

  confirmationDialog(): void {
    this.isDialogBlocked.next(true);
    if (
      this.oldStatus !== this.tempInvoice.status &&
      this.tempInvoice.status === 'Fechado'
    ) {
      this.dialogService
        .open(ConfirmationDialogComponent, {
          context: {
            question: 'Realmente deseja fechar o orçamento',
          },
          dialogClass: 'my-dialog',
          closeOnBackdropClick: false,
          closeOnEsc: false,
          autoFocus: false,
        })
        .onClose.pipe(take(1))
        .subscribe((response) => {
          if (response) {
            this.registerInvoice();
            this.submit.emit();
          }
          this.isDialogBlocked.next(false);
        });
    } else {
      this.registerInvoice();
    }
  }

  tooltipText = (contractorItem: Contractor | string | undefined): string => {
    if (contractorItem === undefined) return '';
    return (
      `CPF/CNPJ: ` +
      this.contractorService.idToContractor(contractorItem).document +
      `\nEmail: ` +
      this.contractorService.idToContractor(contractorItem).email +
      `\nEndereço: ` +
      this.contractorService.idToContractor(contractorItem).address
    );
  };

  fixHours(): void {
    const currentTime = new Date();
    this.tempInvoice.created.setHours(currentTime.getHours());
    this.tempInvoice.created.setMinutes(currentTime.getMinutes());
    this.tempInvoice.created.setSeconds(currentTime.getSeconds());
  }

  updateMaterialTotal(): void {
    if (
      this.options.material.value == undefined ||
      this.options.material.value.length == 0 ||
      this.options.material.amount == undefined ||
      this.options.material.amount.length == 0
    )
      this.options.material.total = '0,00';
    else
      this.options.material.total = this.stringUtil.numberToMoney(
        this.stringUtil.moneyToNumber(this.options.material.value) *
          this.stringUtil.moneyToNumber(this.options.material.amount)
      );
  }

  addMaterial(): void {
    if (this.tempInvoice.materialListType == '1') {
      this.options.material.value = '0,00';
      this.options.material.total = '0,00';
    }
    this.updateMaterialTotal();
    this.tempInvoice.materials.push(this.options.material);
    this.options.material = { name: '', amount: '', value: '', total: '0,00' };
    this.updateTotal('material');
  }

  isAddMaterialDisabled(): boolean {
    if (this.tempInvoice.materialListType == '1')
      return (
        this.options.material.name.length == 0 ||
        this.options.material.amount.length == 0
      );
    return (
      this.options.material.name.length == 0 ||
      this.options.material.amount.length == 0 ||
      this.options.material.value.length == 0
    );
  }

  isAddProductDisabled(): boolean {
    if (this.tempInvoice.productListType == '1')
      return (
        this.options.product.name.length == 0 ||
        this.options.product.value.length == 0
      );
    return (
      this.options.product.name.length == 0 ||
      this.options.product.amount.length == 0 ||
      this.options.product.value.length == 0
    );
  }

  /* eslint-disable @typescript-eslint/indent */
  updateProductTotal(): void {
    if (
      this.options.product.value == undefined ||
      this.options.product.value.length == 0 ||
      this.options.product.amount == undefined ||
      this.options.product.amount.length == 0 ||
      this.tempInvoice.productListType == '1'
    )
      this.options.product.total = '0,00';
    else
      this.options.product.total = this.stringUtil.numberToMoney(
        this.stringUtil.moneyToNumber(
          this.options.valueType == '$'
            ? this.options.product.value
            : this.stringUtil.toValue(
                this.options.product.value,
                this.tempInvoice.value
              )
        ) * this.stringUtil.moneyToNumber(this.options.product.amount)
      );
  }
  /* eslint-enable @typescript-eslint/indent */

  addProduct(): void {
    if (this.options.valueType === '%')
      this.options.product.value = this.stringUtil.toValue(
        this.options.product.value,
        this.tempInvoice.value
      );
    if (this.tempInvoice.productListType == '1') {
      this.options.product.amount = '1';
      this.options.product.total = this.options.product.value;
    }
    this.options.product.name = this.options.product.name.toUpperCase();
    this.tempInvoice.products.push(this.options.product);
    const lastItem =
      this.tempInvoice.products[this.tempInvoice.products.length - 1];
    lastItem.percentage = this.stringUtil
      .toPercentage(lastItem.value, this.tempInvoice.value, 20)
      .slice(0, -1);
    this.options.product = new InvoiceProduct();
    this.updateTotal('product');
  }

  addSubproduct(product: InvoiceProduct): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(TextInputDialog, {
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((name) => {
        console.log(name);
        if (name) product.subproducts.push(name.toUpperCase());
        this.isDialogBlocked.next(false);
      });
  }

  updateDiscountPercentage(): void {
    if (this.tempInvoice.discount)
      this.options.discountPercentage = this.stringUtil
        .toPercentageNumber(
          this.stringUtil.moneyToNumber(this.tempInvoice.discount),
          this.tempInvoice.products.reduce(
            (accumulator: number, product: any) =>
              accumulator + this.stringUtil.moneyToNumber(product.value),
            0
          )
        )
        .slice(0, -1);
  }

  updateDiscountValue(): void {
    const total = this.stringUtil.numberToMoney(
      this.tempInvoice.products.reduce(
        (accumulator: number, product: any) =>
          accumulator + this.stringUtil.moneyToNumber(product.value),
        0
      )
    );
    this.tempInvoice.discount = this.stringUtil.subtractMoney(
      total,
      this.stringUtil.removePercentage(total, this.options.discountPercentage)
    );
  }

  addStage(): void {
    if (this.options.stageValueType === '%')
      this.options.stage.value = this.stringUtil.toValue(
        this.options.stage.value,
        this.tempInvoice.value
      );
    this.options.stage.name = this.options.stage.name;
    this.tempInvoice.stages.push(this.options.stage);
    const lastItem =
      this.tempInvoice.stages[this.tempInvoice.stages.length - 1];
    lastItem.percentage = this.stringUtil
      .toPercentage(lastItem.value, this.tempInvoice.value, 20)
      .slice(0, -1);
    this.options.stage = new InvoiceStage();
    this.updateTotal('stage');
  }

  remainingBalance(base: string): string {
    if (this.tempInvoice.value == undefined) return '0,00';
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.tempInvoice.value) -
        this.stringUtil.moneyToNumber(
          base === 'product' ? this.options.total : this.options.stageTotal
        )
    );
  }

  updateMaterialList(): void {
    if (this.tempInvoice.materialListType == '2') {
      this.tempInvoice.materials.forEach((material, index) => {
        material.amount = this.brMask.writeValueMoney(material.amount, {
          money: true,
          thousand: '.',
          decimalCaracter: ',',
          decimal: 2,
        });
        this.updateItemTotal(this.tempInvoice.materials, index);
      });
      this.updateTotal('material');
    }
  }

  updateTotal(base: 'product' | 'stage' | 'material'): void {
    switch (base) {
      case 'product': {
        const subtotal = this.tempInvoice.products.reduce(
          (accumulator: number, product: any) =>
            accumulator +
            this.stringUtil.moneyToNumber(
              this.tempInvoice.productListType == '1'
                ? product.value
                : product.total
            ),
          0
        );
        if (this.tempInvoice.discount)
          this.options.total = this.stringUtil.numberToMoney(
            subtotal - this.stringUtil.moneyToNumber(this.tempInvoice.discount)
          );
        else this.options.total = this.stringUtil.numberToMoney(subtotal);
        this.options.subtotal = this.stringUtil.numberToMoney(subtotal);
        break;
      }
      case 'stage': {
        this.options.stageTotal = this.stringUtil.numberToMoney(
          this.tempInvoice.stages.reduce(
            (accumulator: number, stage: any) =>
              accumulator + this.stringUtil.moneyToNumber(stage.value),
            0
          )
        );
        break;
      }
      case 'material': {
        this.options.materialTotal = this.stringUtil.numberToMoney(
          this.tempInvoice.materials.reduce(
            (accumulator: number, material: any) =>
              accumulator + this.stringUtil.moneyToNumber(material.total),
            0
          )
        );
        break;
      }
      default: {
        break;
      }
    }
  }

  updateValue(array: any[], idx: number): void {
    array[idx].value = this.stringUtil.applyPercentage(
      this.tempInvoice.value,
      array[idx].percentage
    );
  }

  updatePercentage(array: any[], idx: number): void {
    array[idx].percentage = this.stringUtil
      .toPercentage(array[idx].value, this.tempInvoice.value)
      .slice(0, -1);
  }

  updateItemTotal(array: any[], idx: number): void {
    if (
      array[idx].value == undefined ||
      array[idx].value.length == 0 ||
      array[idx].amount == undefined ||
      array[idx].amount.length == 0
    )
      array[idx].total = '0,00';
    else
      array[idx].total = this.stringUtil.numberToMoney(
        this.stringUtil.moneyToNumber(array[idx].value) *
          this.stringUtil.moneyToNumber(array[idx].amount)
      );
  }

  updateNetValue(): void {
    if (!this.tempInvoice.value && !this.tempInvoice.administration) {
      this.options.netValue = '0,00';
    } else {
      this.options.netValue = this.contractService.toNetValue(
        this.tempInvoice.value,
        this.utils.nfPercentage(this.tempInvoice),
        this.utils.nortanPercentage(this.tempInvoice)
      );
    }
  }

  updateGrossValue(): void {
    const newInvoiceValue = this.contractService.toGrossValue(
      this.options.netValue,
      this.utils.nfPercentage(this.tempInvoice),
      this.utils.nortanPercentage(this.tempInvoice)
    );

    this.tempInvoice.value = newInvoiceValue;
  }
}

@Component({
  selector: 'ngx-text-input-dialog',
  template: `
    <nb-card
      [ngStyle]="{
        'width.px': dialogWidth()
      }"
    >
      <nb-card-header>Subproduto:</nb-card-header>
      <nb-card-body>
        <input #name nbInput fullWidth placeholder="Digite o subproduto" />
      </nb-card-body>
      <nb-card-footer>
        <button
          nbButton
          fullWidth
          status="primary"
          (click)="dismiss(name.value)"
        >
          Adicionar
        </button>
      </nb-card-footer>
    </nb-card>
  `,
})
export class TextInputDialog
  extends BaseDialogComponent
  implements AfterViewInit
{
  @ViewChild('name', { read: ElementRef }) inputRef!: ElementRef;
  constructor(
    @Inject(NB_DOCUMENT) protected derivedDocument: Document,
    @Optional() protected derivedRef: NbDialogRef<TextInputDialog>
  ) {
    super(derivedDocument, derivedRef);
  }

  dismiss(name: string): void {
    this.derivedRef.close(name);
  }

  ngAfterViewInit(): void {
    this.inputRef.nativeElement.focus();
  }

  dialogWidth(): number {
    return window.innerWidth * 0.5;
  }
}
