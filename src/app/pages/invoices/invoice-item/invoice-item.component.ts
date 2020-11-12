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
} from '@angular/core';
import { DepartmentService } from '../../../shared/services/department.service';
import { InvoiceService } from '../../../shared/services/invoice.service';
import { ContractService } from '../../../shared/services/contract.service';
import { ContractorService } from '../../../shared/services/contractor.service';
import { StringUtilService } from '../../../shared/services/string-util.service';
import { UserService } from '../../../shared/services/user.service';
import {
  NbDialogRef,
  NbDialogService,
  NbMediaBreakpointsService,
} from '@nebular/theme';
import { ContractorDialogComponent } from '../../contractors/contractor-dialog/contractor-dialog.component';
import { take, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { parseISO } from 'date-fns';
import * as invoice_validation from '../../../shared/invoice-validation.json';

@Component({
  selector: 'ngx-invoice-item',
  templateUrl: './invoice-item.component.html',
  styleUrls: ['./invoice-item.component.scss'],
})
export class InvoiceItemComponent implements OnInit, OnDestroy {
  @Input() iInvoice: any;
  @Output() submit = new EventEmitter<void>();
  invoice: any;
  teamMember: any = {};
  options = {
    aep: '',
    aee: '',
    aec: '',
    valueType: '$',
    stageValueType: '$',
    product: {
      value: '',
      name: '',
      subproducts: [],
    },
    stage: {
      value: '',
      name: '',
    },
    total: '0',
    stageTotal: '0',
  };
  destroy$ = new Subject<void>();
  editing = false;
  submitted = false;
  today = new Date();
  invoiceNumber: number;
  revision: number = 0;
  validation = (invoice_validation as any).default;
  oldStatus: string;
  DEPARTMENTS: string[] = [];
  COORDINATIONS: string[] = [];
  ALL_COORDINATIONS: string[] = [];
  USER_COORDINATIONS: string[] = [];
  STATOOS = ['Em análise', 'Fechado', 'Negado'];
  CONTRACTORS = [];
  USERS = [];

  constructor(
    private dialogService: NbDialogService,
    private invoiceService: InvoiceService,
    private departmentService: DepartmentService,
    private contractService: ContractService,
    private userService: UserService,
    public stringUtil: StringUtilService,
    private breakpointService: NbMediaBreakpointsService,
    public contractorService: ContractorService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    if (this.iInvoice) {
      this.invoice = Object.assign({}, this.iInvoice);
      console.log(this.invoice);
      this.editing = true;
      this.COORDINATIONS = this.departmentService.buildCoordinationsList(
        this.invoice.department
      );
      this.invoice.department = this.departmentService.composedName(
        this.invoice.department
      );
      this.revision = +this.invoice.code.slice(this.invoice.code.length - 2);
      this.revision += 1;
      this.oldStatus = this.invoice.status;
      if (
        this.invoice.created !== undefined &&
        typeof this.invoice.created !== 'object'
      )
        this.invoice.created = parseISO(this.invoice.created);
      if (
        this.invoice.lastUpdate !== undefined &&
        typeof this.invoice.lastUpdate !== 'object'
      )
        this.invoice.lastUpdate = parseISO(this.invoice.lastUpdate);
      if (this.invoice.contractor._id !== undefined)
        this.invoice.contractor = this.invoice.contractor._id;
      if (this.invoice.peep == undefined)
        this.invoice.peep =
          '20 dias úteis para o primeiro estudo preliminar, mais 15 dias úteis para cada pedido de alteração feito pelo cliente';
      if (this.invoice.dep == undefined)
        this.invoice.dep =
          'Serão feitas reunião inicial para identificação das necessidades e uma reunião para cada alteração da proposta. Serão apresentadas imagens em 3D para melhor entendimento do projeto.\nToda e qualquer alteração é feita nessa etapa.';
      if (this.invoice.peee == undefined)
        this.invoice.peee =
          'início após aprovação da proposta preliminar, 30 dias úteis para finalização';
      if (this.invoice.dee == undefined)
        this.invoice.dee =
          'Os itens acima compõem o produto final a ser entregue contando com todas as informações técnicas necessárias e suficientes para a realização da obra.';
      if (this.invoice.peec == undefined)
        this.invoice.peec =
          'será acompanhando o processo de aprovação do projeto junto ao órgão municipal competente';
      if (this.invoice.dec == undefined)
        this.invoice.dec =
          'Serão feitas 3 visitas à obra para verificar o andamento do trabalho conforme projeto.';
      this.updateTotal('product');
      this.updateTotal('stage');
    } else {
      this.invoice = {
        created: new Date(),
        lastUpdate: new Date(),
      };
    }
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
        this.CONTRACTORS = contractors;
      });
    this.userService.getUsersList().then((uL: any[]) => {
      this.USERS = uL;
    });
    this.DEPARTMENTS = this.departmentService.buildDepartmentList();
    this.ALL_COORDINATIONS = this.departmentService
      .buildAllCoordinationsList()
      .sort();
  }

  registerInvoice(): void {
    this.invoice.department = this.departmentService.extractAbreviation(
      this.invoice.department
    );
    this.submitted = true;
    this.invoice.lastUpdate = new Date();
    if (this.editing) {
      this.updateRevision();
      this.invoiceService.editInvoice(this.invoice);
      if (this.oldStatus !== this.invoice.status) {
        if (this.invoice.status === 'Fechado')
          this.contractService.saveContract(this.invoice);
      }
      this.invoice.contractorName = this.contractorService.idToName(
        this.invoice.contractor
      );
      this.iInvoice = Object.assign({}, this.invoice);
    } else {
      this.invoiceService.saveInvoice(this.invoice);
    }
    this.submit.emit();
  }

  onDepartmentChange() {
    this.updateCode();
    this.updateCoordination();
  }

  updateCoordination() {
    this.invoice.coordination = undefined;
    this.COORDINATIONS = this.departmentService.buildCoordinationsList(
      this.departmentService.extractAbreviation(this.invoice.department)
    );
  }

  addColaborator(): void {
    this.invoice.team.push(Object.assign({}, this.teamMember));
    this.teamMember = {};
    this.USER_COORDINATIONS = [];
  }

  idToName(id: string): string {
    const entry = this.USERS.find((el) => el._id === id);
    return entry?.fullName;
  }

  updateUserCoordinations(): void {
    const selectedUser = this.USERS.find(
      (el) => el._id === this.teamMember.user
    );
    const active: boolean[] = [
      selectedUser.adm,
      selectedUser.design,
      selectedUser.obras,
      selectedUser.impermeabilizacao,
      selectedUser.instalacoes,
      selectedUser.ambiental,
      selectedUser.arquitetura,
      selectedUser.hidrico,
      selectedUser.eletrica,
      selectedUser.civil,
      selectedUser.sanitaria,
    ];
    this.USER_COORDINATIONS = this.ALL_COORDINATIONS.filter(
      (cd: string, idx: number) => {
        return active[idx];
      }
    );
    this.teamMember.coordination = undefined;
  }

  updateCode(): void {
    if (!this.editing) {
      this.invoice.code =
        'ORC-' +
        this.invoiceNumber +
        '/' +
        new Date().getFullYear() +
        '-NRT/' +
        (this.invoice.department
          ? this.departmentService.extractAbreviation(this.invoice.department)
          : '') +
        '-00';
    }
  }

  updateRevision(): void {
    this.invoice.code =
      this.invoice.code.slice(0, this.invoice.code.length - 2) +
      this.revision.toString().padStart(2, '0');
  }

  addContractor(): void {
    this.dialogService.open(ContractorDialogComponent, {
      context: {
        title: 'ADICIONAR CLIENTE',
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }

  tooltipText(contractorItem: any): string {
    if (contractorItem === undefined) return undefined;
    const contractor = contractorItem.fullName
      ? contractorItem
      : this.contractorService.idToContractor(this.invoice.contractor);
    return (
      `CPF/CNPJ: ` +
      contractor?.document +
      `\nEmail: ` +
      contractor?.email +
      `\nEndereço: ` +
      contractor?.address
    );
  }

  isPhone(): boolean {
    const { md } = this.breakpointService.getBreakpointsMap();
    return document.documentElement.clientWidth <= md;
  }

  fixHours(): void {
    const currentTime = new Date();
    this.invoice.created.setHours(currentTime.getHours());
    this.invoice.created.setMinutes(currentTime.getMinutes());
    this.invoice.created.setSeconds(currentTime.getSeconds());
  }

  addProduct(): void {
    if (this.options.valueType === '%')
      this.options.product.value = this.stringUtil.toValue(
        this.options.product.value,
        this.invoice.value
      );
    this.options.product.name = this.options.product.name.toUpperCase();
    this.invoice.products.push(this.options.product);
    this.options.product = { value: '', name: '', subproducts: [] };
    this.updateTotal('product');
  }

  addSubproduct(product): void {
    console.log(product);
    this.dialogService
      .open(TextInputDialog, {
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.subscribe(
        (name) => name && product.subproducts.push(name.toUpperCase())
      );
  }

  addStage(): void {
    if (this.options.stageValueType === '%')
      this.options.stage.value = this.stringUtil.toValue(
        this.options.stage.value,
        this.invoice.value
      );
    this.options.stage.name = this.options.stage.name;
    this.invoice.stages.push(this.options.stage);
    this.options.stage = { value: '', name: '' };
    this.updateTotal('stage');
  }

  remainingBalance(base: string): string {
    return this.stringUtil.numberToMoney(
      this.stringUtil.moneyToNumber(this.invoice.value) -
        this.stringUtil.moneyToNumber(
          base === 'product' ? this.options.total : this.options.stageTotal
        )
    );
  }

  updateTotal(base: string): void {
    if (base === 'product')
      this.options.total = this.stringUtil.numberToMoney(
        this.invoice.products.reduce(
          (accumulator: number, produtc: any) =>
            accumulator + this.stringUtil.moneyToNumber(produtc.value),
          0
        )
      );
    else
      this.options.stageTotal = this.stringUtil.numberToMoney(
        this.invoice.stages.reduce(
          (accumulator: number, stage: any) =>
            accumulator + this.stringUtil.moneyToNumber(stage.value),
          0
        )
      );
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
export class TextInputDialog implements AfterViewInit {
  @ViewChild('name', { read: ElementRef }) inputRef;
  constructor(protected ref: NbDialogRef<TextInputDialog>) {}

  dismiss(name: string): void {
    this.ref.close(name);
  }

  ngAfterViewInit(): void {
    this.inputRef.nativeElement.focus();
  }

  dialogWidth(): number {
    return window.innerWidth * 0.5;
  }
}
