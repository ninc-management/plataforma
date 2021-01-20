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
import { CompleterService, CompleterData } from 'ng2-completer';
import { DepartmentService } from '../../../shared/services/department.service';
import { InvoiceService } from '../../../shared/services/invoice.service';
import { ContractService } from '../../../shared/services/contract.service';
import { ContractorService } from '../../../shared/services/contractor.service';
import { StringUtilService } from '../../../shared/services/string-util.service';
import { UserService } from '../../../shared/services/user.service';
import { UtilsService } from 'app/shared/services/utils.service';
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
  @Input() tempInvoice: any;
  @Output() submit = new EventEmitter<void>();
  teamMember: any = {};
  options = {
    aep: '',
    aee: '',
    aec: '',
    important: '',
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

  contractorSearch: string;
  contractorData: CompleterData;
  userSearch: string;
  userData: CompleterData;

  DEPARTMENTS: string[] = [];
  COORDINATIONS: string[] = [];
  ALL_COORDINATIONS: string[] = [];
  USER_COORDINATIONS: string[] = [];
  STATOOS = ['Em análise', 'Fechado', 'Negado'];

  constructor(
    private dialogService: NbDialogService,
    private invoiceService: InvoiceService,
    private departmentService: DepartmentService,
    private contractService: ContractService,
    private userService: UserService,
    public stringUtil: StringUtilService,
    private utils: UtilsService,
    private breakpointService: NbMediaBreakpointsService,
    public contractorService: ContractorService,
    public completerService: CompleterService
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
      this.contractorSearch = this.tempInvoice.contractor.fullName;
      this.revision = +this.tempInvoice.code.slice(
        this.tempInvoice.code.length - 2
      );
      this.revision += 1;
      this.oldStatus = this.tempInvoice.status;
      if (
        this.tempInvoice.created !== undefined &&
        typeof this.tempInvoice.created !== 'object'
      )
        this.tempInvoice.created = parseISO(this.tempInvoice.created);
      if (
        this.tempInvoice.lastUpdate !== undefined &&
        typeof this.tempInvoice.lastUpdate !== 'object'
      )
        this.tempInvoice.lastUpdate = parseISO(this.tempInvoice.lastUpdate);
      this.updateTotal('product');
      this.updateTotal('stage');
    } else {
      this.tempInvoice = {
        created: new Date(),
        lastUpdate: new Date(),
        importants: [],
        stages: [],
        products: [],
        laec: [],
        laee: [],
        laep: [],
        team: [],
      };
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
        'O  pagamento pode ser feito em dinheiro, via depósito ou transferência, podendo ser combinado entre as partes no momento da assinatura do contrato.',
        'Está incluso o registro de responsabilidade técnica, necessário para aprovação do projeto.',
        'Não estão inclusas taxas recolhidas junto à Prefeitura Municipal ou outras taxas que sejam necessárias para a aprovação e execução do projeto, sendo de responsabilidade do cliente.',
        'O produto final será entregue por e-mail em PDF para o cliente + 02 (duas) cópias impressas. ',
        'O orçamento é baseado nas necessidades iniciais do cliente, caso durante o projeto surjam novas demandas, será tratado entre o prestador e serviço e o contratante.',
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
        if (this.iInvoice && this.tempInvoice.contractorFullName == undefined)
          this.tempInvoice.contractorFullName = this.contractorService.idToName(
            this.tempInvoice.contractor
          );
      });

    this.userData = this.completerService
      .local(this.userService.getUsersList(), 'fullName', 'fullName')
      .imageField('profilePicture');
    this.DEPARTMENTS = this.departmentService.buildDepartmentList();
    this.ALL_COORDINATIONS = this.departmentService.buildAllCoordinationsList();
  }

  registerInvoice(): void {
    this.tempInvoice.department = this.departmentService.extractAbreviation(
      this.tempInvoice.department
    );
    this.submitted = true;
    this.tempInvoice.lastUpdate = new Date();
    if (this.editing) {
      this.updateRevision();
      this.invoiceService.editInvoice(this.tempInvoice);
      if (this.oldStatus !== this.tempInvoice.status) {
        if (this.tempInvoice.status === 'Fechado')
          this.contractService.saveContract(this.tempInvoice);
      }
      this.tempInvoice.contractorName = this.contractorService.idToName(
        this.tempInvoice.contractor
      );
      this.iInvoice = this.utils.deepCopy(this.tempInvoice);
    } else {
      this.invoiceService.saveInvoice(this.tempInvoice);
    }
    this.submit.emit();
  }

  onDepartmentChange() {
    this.updateCode();
    this.updateCoordination();
  }

  updateCoordination() {
    this.tempInvoice.coordination = undefined;
    this.COORDINATIONS = this.departmentService.buildCoordinationsList(
      this.departmentService.extractAbreviation(this.tempInvoice.department)
    );
  }

  addColaborator(): void {
    this.tempInvoice.team.push(Object.assign({}, this.teamMember));
    this.userSearch = undefined;
    this.teamMember = {};
    this.USER_COORDINATIONS = [];
  }

  updateUserCoordinations(): void {
    const selectedUser = this.teamMember.user;
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
    this.dialogService.open(ContractorDialogComponent, {
      context: {
        title: 'CADASTRO DE CLIENTE',
      },
      dialogClass: 'my-dialog',
      closeOnBackdropClick: false,
      closeOnEsc: false,
      autoFocus: false,
    });
  }

  tooltipText(contractorItem: any): string {
    if (contractorItem === undefined) return undefined;
    return (
      `CPF/CNPJ: ` +
      contractorItem?.document +
      `\nEmail: ` +
      contractorItem?.email +
      `\nEndereço: ` +
      contractorItem?.address
    );
  }

  isPhone(): boolean {
    const { md } = this.breakpointService.getBreakpointsMap();
    return document.documentElement.clientWidth <= md;
  }

  fixHours(): void {
    const currentTime = new Date();
    this.tempInvoice.created.setHours(currentTime.getHours());
    this.tempInvoice.created.setMinutes(currentTime.getMinutes());
    this.tempInvoice.created.setSeconds(currentTime.getSeconds());
  }

  addProduct(): void {
    if (this.options.valueType === '%')
      this.options.product.value = this.stringUtil.toValue(
        this.options.product.value,
        this.tempInvoice.value
      );
    this.options.product.name = this.options.product.name.toUpperCase();
    this.tempInvoice.products.push(this.options.product);
    this.options.product = { value: '', name: '', subproducts: [] };
    this.updateTotal('product');
  }

  addSubproduct(product): void {
    this.dialogService
      .open(TextInputDialog, {
        dialogClass: 'my-dialog',
        closeOnBackdropClick: false,
        closeOnEsc: false,
        autoFocus: false,
      })
      .onClose.pipe(take(1))
      .subscribe(
        (name) => name && product.subproducts.push(name.toUpperCase())
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
    this.options.stage = { value: '', name: '' };
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

  updateTotal(base: string): void {
    if (base === 'product')
      this.options.total = this.stringUtil.numberToMoney(
        this.tempInvoice.products.reduce(
          (accumulator: number, produtc: any) =>
            accumulator + this.stringUtil.moneyToNumber(produtc.value),
          0
        )
      );
    else
      this.options.stageTotal = this.stringUtil.numberToMoney(
        this.tempInvoice.stages.reduce(
          (accumulator: number, stage: any) =>
            accumulator + this.stringUtil.moneyToNumber(stage.value),
          0
        )
      );
  }

  trackByIndex(index: number, obj: any): any {
    return index;
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
