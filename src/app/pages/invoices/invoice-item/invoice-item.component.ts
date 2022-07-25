import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm, NgModel, ValidatorFn, Validators } from '@angular/forms';
import { NbAccessChecker } from '@nebular/security';
import { NbDialogService } from '@nebular/theme';
import { cloneDeep, isEqual } from 'lodash';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { map, skipWhile, take } from 'rxjs/operators';

import { ContractorDialogComponent } from '../../contractors/contractor-dialog/contractor-dialog.component';
import { ConfirmationDialogComponent } from 'app/shared/components/confirmation-dialog/confirmation-dialog.component';
import { TextInputDialogComponent } from 'app/shared/components/text-input-dialog/text-input-dialog.component';
import { BrMaskDirective } from 'app/shared/directives/br-mask.directive';
import { ConfigService } from 'app/shared/services/config.service';
import { ContractService } from 'app/shared/services/contract.service';
import { ContractorService } from 'app/shared/services/contractor.service';
import { INVOICE_STATOOS, InvoiceService } from 'app/shared/services/invoice.service';
import { NotificationService } from 'app/shared/services/notification.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { TeamService } from 'app/shared/services/team.service';
import { UserService } from 'app/shared/services/user.service';
import {
  forceValidatorUpdate,
  idToProperty,
  isOfType,
  isPhone,
  nfPercentage,
  nortanPercentage,
  tooltipTriggers,
  trackByIndex,
} from 'app/shared/utils';

import { Contractor } from '@models/contractor';
import { Invoice, InvoiceMaterial, InvoiceProduct, InvoiceStage, InvoiceTeamMember } from '@models/invoice';
import { NotificationTags } from '@models/notification';
import { InvoiceConfig } from '@models/platformConfig';
import { Sector } from '@models/shared';
import { Team } from '@models/team';
import { User } from '@models/user';

import invoice_validation from 'app/shared/validators/invoice-validation.json';

@Component({
  selector: 'ngx-invoice-item',
  templateUrl: './invoice-item.component.html',
  styleUrls: ['./invoice-item.component.scss'],
})
export class InvoiceItemComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() iInvoice = new Invoice();
  @Input() tempInvoice = new Invoice();
  @Input() isDialogBlocked = new BehaviorSubject<boolean>(false);
  @Input() isFormDirty = new BehaviorSubject<boolean>(false);
  @Output() submit = new EventEmitter<void>();
  @ViewChild('contractor', { static: true }) contractorFieldRef!: NgModel;
  @ViewChild('form') ngForm = {} as NgForm;

  private CONTRACTOR_NAME = 'teste';
  teamMember: InvoiceTeamMember = {
    user: undefined,
    sector: undefined,
    distribution: '',
    netValue: '',
    grossValue: '',
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
      unit: '',
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

  config = new InvoiceConfig();

  destroy$ = new Subject<void>();
  editing = false;
  today = new Date();
  invoiceNumber = 0;
  revision = 0;
  validation = invoice_validation as any;
  oldStatus: INVOICE_STATOOS = INVOICE_STATOOS.EM_ANALISE;

  memberChanged$ = new BehaviorSubject<boolean>(true);
  contractorSearch = '';
  contractorData: Observable<Contractor[]> = of([]);
  userSearch = '';
  availableUsers: Observable<User[]> = of([]);
  authorSearch = '';
  authorData: Observable<User[]> = of([]);
  associateSearch = '';
  associateData: Observable<User[]> = of([]);

  NORTAN_TEAMS: Team[] = [];
  SECTORS: Sector[] = [];
  ALL_SECTORS: Sector[] = [];
  USER_SECTORS: Sector[] = [];
  tStatus = INVOICE_STATOOS;
  STATOOS = Object.values(INVOICE_STATOOS);

  forceValidatorUpdate = forceValidatorUpdate;
  trackByIndex = trackByIndex;
  isPhone = isPhone;
  idToProperty = idToProperty;
  tooltipTriggers = tooltipTriggers;

  constructor(
    private dialogService: NbDialogService,
    private invoiceService: InvoiceService,
    private contractService: ContractService,
    private brMask: BrMaskDirective,
    private configService: ConfigService,
    private notificationService: NotificationService,
    public stringUtil: StringUtilService,
    public userService: UserService,
    public contractorService: ContractorService,
    public accessChecker: NbAccessChecker,
    public teamService: TeamService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    combineLatest([this.configService.isDataLoaded$, this.configService.getConfig()])
      .pipe(
        skipWhile(([configLoaded, _]) => !configLoaded),
        take(1)
      )
      .subscribe(([_, config]) => {
        this.config = config[0].invoiceConfig;
      });
    if (this.iInvoice._id || this.iInvoice.locals.isModel) {
      this.editing = this.tempInvoice.locals.isModel == undefined;
      if (!this.editing) {
        this.tempInvoice.created = new Date();
        this.tempInvoice.lastUpdate = new Date();
      }
      if (this.tempInvoice.nortanTeam) this.SECTORS = this.teamService.idToTeam(this.tempInvoice.nortanTeam).sectors;
      this.contractorSearch = idToProperty(
        this.tempInvoice.contractor,
        this.contractorService.idToContractor.bind(this.contractorService),
        'fullName'
      );
      this.associateSearch = this.tempInvoice.prospectedBy
        ? idToProperty(this.tempInvoice.prospectedBy, this.userService.idToUser.bind(this.userService), 'fullName')
        : '';
      this.revision = +this.tempInvoice.code?.slice(this.tempInvoice.code.length - 2);
      this.oldStatus = this.tempInvoice.status as INVOICE_STATOOS;
      if (this.tempInvoice.materialListType == undefined) this.tempInvoice.materialListType = '1';
      if (this.tempInvoice.productListType == undefined) this.tempInvoice.productListType = '2';
      if (this.tempInvoice.invoiceType == undefined) this.tempInvoice.invoiceType = 'projeto';
      this.updateDiscountPercentage();
      this.updateLastValues();
      this.updateDependentValues(this.tempInvoice.products, 'product');
      this.updateDependentValues(this.tempInvoice.stages, 'stage');
      this.updateLastValues();
      this.updateTotal('material');
      this.updateNetValue();
    } else {
      this.tempInvoice = new Invoice();
      this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
        this.tempInvoice.author = user;
        if (this.tempInvoice.team.length === 0 && user._id) {
          this.tempInvoice.team.push({
            user: user,
            sector: this.tempInvoice.sector ? this.tempInvoice.sector : undefined,
            distribution: '',
            netValue: '',
            grossValue: '',
          });
        }
      });
    }
    if (this.tempInvoice.contactPlural == undefined) this.tempInvoice.contactPlural = false;
    if (this.tempInvoice.peep == undefined)
      this.tempInvoice.peep =
        '20 dias úteis para o primeiro estudo preliminar, mais 15 dias úteis para cada pedido de alteração feito pelo cliente';
    if (this.tempInvoice.dep == undefined)
      this.tempInvoice.dep =
        'Serão feitas reunião inicial para identificação das necessidades e uma reunião para cada alteração da proposta. Serão apresentadas imagens em 3D para melhor entendimento do projeto.\nToda e qualquer alteração é feita nessa etapa.';
    if (this.tempInvoice.peee == undefined)
      this.tempInvoice.peee = 'início após aprovação da proposta preliminar, 30 dias úteis para finalização';
    if (this.tempInvoice.dee == undefined)
      this.tempInvoice.dee =
        'Os itens acima compõem o produto final a ser entregue contando com todas as informações técnicas necessárias e suficientes para a realização da obra.';
    if (this.tempInvoice.peec == undefined)
      this.tempInvoice.peec =
        'será acompanhando o processo de aprovação do projeto junto ao órgão municipal competente';
    if (this.tempInvoice.dec == undefined)
      this.tempInvoice.dec = 'Serão feitas 3 visitas à obra para verificar o andamento do trabalho conforme projeto.';
    if (this.tempInvoice.importants.length == 0)
      this.tempInvoice.importants = [
        {
          text: 'O  pagamento pode ser feito em dinheiro, via depósito ou transferência, podendo ser combinado entre as partes no momento da assinatura do contrato',
          isVisible: true,
        },
        {
          text: 'Está incluso o registro de responsabilidade técnica, necessário para aprovação do projeto',
          isVisible: true,
        },
        {
          text: 'Não estão inclusas taxas recolhidas junto à Prefeitura Municipal ou outras taxas que sejam necessárias para a aprovação e execução do projeto, sendo de responsabilidade do cliente',
          isVisible: true,
        },
        {
          text: 'O produto final será entregue por e-mail em PDF para o cliente + 02 (duas) cópias impressas',
          isVisible: true,
        },
        {
          text: 'O orçamento é baseado nas necessidades iniciais do cliente, caso durante o projeto surjam novas demandas, será tratado entre o prestador e serviço e o contratante',
          isVisible: true,
        },
      ];
    this.invoiceService
      .currentYearInvoices()
      .pipe(take(2))
      .subscribe((accumulated: number) => {
        this.invoiceNumber = accumulated + 1;
        this.updateCode();
      });

    this.contractorData = this.contractorService.getContractors();

    this.associateData = this.userService.getUsers().pipe(map((users) => users.filter((user) => user.active)));

    this.availableUsers = combineLatest([this.userService.getUsers(), this.memberChanged$]).pipe(
      map(([users, _]) => {
        return users.filter((user) => !this.userService.isUserInTeam(user, this.tempInvoice.team) && user.active);
      })
    );
    this.userService.currentUser$.pipe(take(1)).subscribe((user) => {
      this.accessChecker
        .isGranted('aer', 'invoice-author')
        .pipe(take(1))
        .subscribe((isGranted) => {
          if (isGranted && user.AER) {
            const u = cloneDeep(user);
            if (u.AER) {
              u.AER.unshift(u._id);
              this.authorData = of(
                u.AER.filter((u): u is User | string => u != undefined).map((u) => this.userService.idToUser(u))
              );
              if (
                this.tempInvoice._id &&
                this.tempInvoice.author &&
                u.AER.includes(this.userService.idToUser(this.tempInvoice.author)?._id)
              )
                this.authorSearch = idToProperty(
                  this.tempInvoice.author,
                  this.userService.idToUser.bind(this.userService),
                  'fullName'
                );
              else {
                this.authorSearch = '';
                this.tempInvoice.author = undefined;
              }
            }
          }
        });
    });

    this.teamService
      .getTeams()
      .pipe(
        skipWhile((teams) => teams.length == 0),
        take(1)
      )
      .subscribe((teams) => {
        this.NORTAN_TEAMS = teams;
        this.ALL_SECTORS = this.teamService.sectorsListAll();
      });
  }

  ngAfterViewInit(): void {
    //TODO: Trocar para addValidator no Angular 12
    this.contractorFieldRef.control.setValidators([Validators.required, this.isTestContractor()]);
    this.ngForm.statusChanges?.subscribe(() => {
      if (this.ngForm.dirty) this.isFormDirty.next(true);
    });
  }

  isTestContractor(): ValidatorFn {
    return () =>
      this.contractorFieldRef.control.value == this.CONTRACTOR_NAME &&
      this.tempInvoice.status === INVOICE_STATOOS.FECHADO
        ? { isTestUser: true }
        : null;
  }

  registerInvoice(): void {
    if (this.editing) {
      if (!isEqual(this.iInvoice, this.tempInvoice)) {
        if (!this.tempInvoice.team.map((member) => member.distribution).every((distribution) => distribution !== ''))
          this.tempInvoice = this.invoiceService.setDefaultDistribution(this.tempInvoice);
        this.updateRevision();
        this.tempInvoice.lastUpdate = new Date();
        if (this.oldStatus !== this.tempInvoice.status) {
          const lastStatusIndex = this.tempInvoice.statusHistory.length - 1;
          this.tempInvoice.statusHistory[lastStatusIndex].end = this.tempInvoice.lastUpdate;
          this.tempInvoice.statusHistory.push({
            status: this.tempInvoice.status,
            start: this.tempInvoice.lastUpdate,
          });
        }
        this.invoiceService.editInvoice(this.tempInvoice);
        if (this.oldStatus !== this.tempInvoice.status) {
          if (this.tempInvoice.status === INVOICE_STATOOS.FECHADO) {
            this.contractService.saveContract(this.tempInvoice);
            this.notifyInvoiceTeam();
            this.notifyAllUsers();
          }
        }
        this.tempInvoice.locals.contractorName = idToProperty(
          this.tempInvoice.contractor,
          this.contractorService.idToContractor.bind(this.contractorService),
          'fullName'
        );

        this.iInvoice = cloneDeep(this.tempInvoice);
        this.isFormDirty.next(false);
      }
    } else {
      this.tempInvoice.lastUpdate = new Date();
      this.tempInvoice.statusHistory.push({
        status: this.tempInvoice.status,
        start: this.tempInvoice.created,
      });
      this.invoiceService.saveInvoice(this.tempInvoice, (savedInvoice: Invoice) => {
        if (savedInvoice.status === INVOICE_STATOOS.FECHADO) {
          this.contractService.saveContract(savedInvoice);
          this.notifyInvoiceTeam();
          this.notifyAllUsers();
        }
      });
      this.isFormDirty.next(false);
      this.submit.emit();
    }
  }

  updateLastValues(): void {
    this.options.lastValue = this.tempInvoice.value ? this.tempInvoice.value.slice() : '0';
    this.options.lastProducts = cloneDeep(this.tempInvoice.products);
    this.options.lastStages = cloneDeep(this.tempInvoice.stages);
  }

  updateDependentValues(array: any[], type: 'stage' | 'product'): void {
    if (this.tempInvoice.value !== '0') {
      const lastArray = type == 'stage' ? this.options.lastStages : this.options.lastProducts;
      array.map((item, index) => {
        const last = lastArray[index];
        let p = last.percentage ? last.percentage : this.toPercentage(last);
        if (type == 'product') {
          p = this.stringUtil.toPercentage(item.value, this.tempInvoice.value, 20);
        }
        if (type == 'stage') {
          item.value = this.stringUtil.applyPercentage(this.tempInvoice.value, p);
        }
        item.percentage = p;
        return item;
      });
    }
    this.updateTotal(type);
  }

  onNortanTeamChange(): void {
    this.updateCode();
    this.updateSector();
  }

  updateSector(): void {
    this.tempInvoice.sector = undefined;
    if (this.tempInvoice.nortanTeam) this.SECTORS = this.teamService.idToTeam(this.tempInvoice.nortanTeam).sectors;
  }

  addColaborator(): void {
    if (this.tempInvoice.team) {
      this.tempInvoice.team.push(cloneDeep(this.teamMember));
      this.userSearch = '';
      this.USER_SECTORS = [];
      this.memberChanged$.next(true);
    }
  }

  /* eslint-disable indent */
  updateCode(): void {
    if (!this.editing) {
      this.tempInvoice.code =
        'ORC-' +
        this.invoiceNumber +
        '/' +
        new Date().getFullYear() +
        '-' +
        this.config.codeAbbreviation +
        '/' +
        (this.tempInvoice.nortanTeam ? this.teamService.idToTeam(this.tempInvoice.nortanTeam).abrev : '') +
        '-00';
    }
  }
  /* eslint-enable indent */

  updateRevision(): void {
    this.tempInvoice.code =
      this.tempInvoice.code.slice(0, this.tempInvoice.code.length - 2) + this.revision.toString().padStart(2, '0');
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
    if (this.oldStatus !== this.tempInvoice.status && this.tempInvoice.status === 'Fechado') {
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
      `\nTelefone: ` +
      this.contractorService.idToContractor(contractorItem).phone +
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
      return this.options.material.name.length == 0 || this.options.material.amount.length == 0;
    return (
      this.options.material.name.length == 0 ||
      this.options.material.amount.length == 0 ||
      this.options.material.value.length == 0
    );
  }

  isAddProductDisabled(): boolean {
    if (this.tempInvoice.productListType == '1')
      return this.options.product.name.length == 0 || this.options.product.value.length == 0;
    return (
      this.options.product.name.length == 0 ||
      this.options.product.amount.length == 0 ||
      this.options.product.value.length == 0
    );
  }

  /* eslint-disable indent */
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
            : this.stringUtil.toValue(this.options.product.value, this.tempInvoice.value)
        ) * this.stringUtil.moneyToNumber(this.options.product.amount)
      );
  }
  /* eslint-enable indent */

  addProduct(): void {
    if (this.options.valueType === '%')
      this.options.product.value = this.stringUtil.toValue(this.options.product.value, this.tempInvoice.value);
    if (this.tempInvoice.productListType == '1') {
      this.options.product.amount = '1';
      this.options.product.total = this.options.product.value;
    }
    this.options.product.name = this.options.product.name.toUpperCase();
    this.tempInvoice.products.push(cloneDeep(this.options.product));
    const lastItem = this.tempInvoice.products[this.tempInvoice.products.length - 1];
    lastItem.percentage = this.stringUtil.toPercentage(lastItem.value, this.tempInvoice.value, 20).slice(0, -1);
    this.options.product = new InvoiceProduct();
    this.updateTotal('product');
    this.updateLastValues();
  }

  addSubproduct(product: InvoiceProduct): void {
    this.isDialogBlocked.next(true);
    this.dialogService
      .open(TextInputDialogComponent, {
        context: {
          title: 'ADICIONAR SUBPRODUTO',
          placeholder: 'Digite o nome do subproduto',
        },
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe((name) => {
        if (name) product.subproducts.push(name.toUpperCase());
        this.isDialogBlocked.next(false);
      });
  }

  updateDiscountPercentage(): void {
    if (this.tempInvoice.discount)
      this.options.discountPercentage = this.stringUtil
        .toPercentageNumber(
          this.stringUtil.moneyToNumber(this.tempInvoice.discount),
          this.stringUtil.moneyToNumber(this.options.subtotal)
        )
        .slice(0, -1);
  }

  updateDiscountValue(): void {
    const total = this.options.subtotal;
    this.tempInvoice.discount = this.stringUtil.subtractMoney(
      total,
      this.stringUtil.removePercentage(total, this.options.discountPercentage)
    );
  }

  addStage(): void {
    if (this.options.stageValueType === '%')
      this.options.stage.value = this.stringUtil.toValue(this.options.stage.value, this.tempInvoice.value);
    this.options.stage.name = this.options.stage.name;
    this.tempInvoice.stages.push(cloneDeep(this.options.stage));
    const lastItem = this.tempInvoice.stages[this.tempInvoice.stages.length - 1];
    lastItem.percentage = this.stringUtil.toPercentage(lastItem.value, this.tempInvoice.value, 20).slice(0, -1);
    this.options.stage = new InvoiceStage();
    this.updateTotal('stage');
    this.updateLastValues();
  }

  remainingBalance(base: 'product' | 'stage'): string {
    if (this.tempInvoice.value == undefined) return '0,00';
    return this.stringUtil.subtractMoney(
      this.tempInvoice.value,
      base === 'product' ? this.options.total : this.options.stageTotal
    );
  }

  updateMaterialList(): void {
    if (this.tempInvoice.materialListType == '2') {
      this.tempInvoice.materials.forEach((material, index) => {
        material.amount = this.brMask.writeValueMoney(material.amount);
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
            this.stringUtil.moneyToNumber(this.tempInvoice.productListType == '1' ? product.value : product.total),
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
            (accumulator: number, stage: any) => accumulator + this.stringUtil.moneyToNumber(stage.value),
            0
          )
        );
        break;
      }
      case 'material': {
        this.options.materialTotal = this.stringUtil.numberToMoney(
          this.tempInvoice.materials.reduce(
            (accumulator: number, material: any) => accumulator + this.stringUtil.moneyToNumber(material.total),
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
    array[idx].value = this.stringUtil.applyPercentage(this.tempInvoice.value, array[idx].percentage);
  }

  updatePercentage(array: any[], idx: number): void {
    array[idx].percentage = this.toPercentage(array[idx]);
  }

  toPercentage(item: InvoiceProduct | InvoiceStage): string {
    let p = this.stringUtil.toPercentage(item.value, this.tempInvoice.value).slice(0, -1);
    if (this.tempInvoice.productListType == '2' && isOfType<InvoiceProduct>(item, ['amount']))
      p = this.stringUtil.numberToMoney(
        this.stringUtil.moneyToNumber(item.amount) * this.stringUtil.moneyToNumber(p),
        20
      );
    return p;
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
        this.stringUtil.moneyToNumber(array[idx].value) * this.stringUtil.moneyToNumber(array[idx].amount)
      );
  }

  updateNetValue(): void {
    if (!this.tempInvoice.value && !this.tempInvoice.administration) {
      this.options.netValue = '0,00';
    } else {
      this.options.netValue = this.contractService.toNetValue(
        this.tempInvoice.value,
        nfPercentage(this.tempInvoice),
        nortanPercentage(this.tempInvoice),
        this.tempInvoice.created
      );
    }
  }

  updateGrossValue(): void {
    const newInvoiceValue = this.contractService.toGrossValue(
      this.options.netValue,
      nfPercentage(this.tempInvoice),
      nortanPercentage(this.tempInvoice)
    );

    this.tempInvoice.value = newInvoiceValue;
  }

  isTotalOK(): boolean {
    return this.options.total !== '0' && this.options.total === this.tempInvoice.value;
  }

  getRemainingPercentage(): string {
    return this.stringUtil.toPercentage(this.options.total, this.tempInvoice.value);
  }

  updateInvoiceValue(): void {
    this.tempInvoice.value = this.options.total;
    this.updateNetValue();
    this.updateDependentValues(this.tempInvoice.stages, 'stage');
    this.updateDependentValues(this.tempInvoice.products, 'product');
    this.updateLastValues();
  }

  isNotEdited(): boolean {
    return isEqual(this.iInvoice, this.tempInvoice);
  }

  notifyAllUsers(): void {
    combineLatest([this.userService.getUsers(), this.userService.isDataLoaded$])
      .pipe(
        skipWhile(([_, isUserDataLoaded]) => !isUserDataLoaded),
        take(1)
      )
      .subscribe(([users, _]) => {
        if (this.tempInvoice.author) {
          const author = this.userService.idToUser(this.tempInvoice.author);
          this.notificationService.notifyMany(users, {
            title: 'Contrato fechado!',
            tag: NotificationTags.CONTRACT_SIGNED,
            message:
              'Toca o sino! O contrato ' +
              this.tempInvoice.code +
              ' d' +
              author.article +
              ' ' +
              (author.exibitionName ? author.exibitionName : author.fullName) +
              ' foi fechado!',
          });
        }
      });
  }

  notifyInvoiceTeam(): void {
    this.notificationService.notifyMany(this.tempInvoice.team, {
      title: 'Um contrato que você faz parte foi fechado!',
      tag: NotificationTags.CONTRACT_SIGNED,
      message: 'O contrato ' + this.tempInvoice.code + ' que você faz parte foi fechado, confira os dados do contrato!',
    });
  }

  copyTextInputService(): void {
    this.tempInvoice.subject = this.tempInvoice.service;
  }
}
