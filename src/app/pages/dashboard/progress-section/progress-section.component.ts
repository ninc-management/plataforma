import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { take, map, startWith } from 'rxjs/operators';
import { MetricsService } from 'app/shared/services/metrics.service';
import { UserService } from 'app/shared/services/user.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { DepartmentService } from 'app/shared/services/department.service';

interface MetricItem {
  title: string;
  tooltip: string;
  value: Observable<string>;
  // activeProgress: Observable<number>;
  description: Observable<string>;
  loading: Observable<boolean>;
}

@Component({
  selector: 'progress-section',
  templateUrl: './progress-section.component.html',
  styleUrls: ['./progress-section.component.scss'],
})
export class ProgressSectionComponent implements OnInit {
  METRICS: MetricItem[] = [];

  constructor(
    private metricsService: MetricsService,
    private userService: UserService,
    private stringUtil: StringUtilService,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$.pipe(take(2)).subscribe((user) => {
      if (user._id != undefined) {
        this.METRICS.push({
          title: 'Balanço do mês',
          tooltip:
            'Soma de todos os valores recebidos pelo associado no mês corrente menos as despesas como fonte pagas no mês corrente',
          value: this.metricsService
            .receivedValueNortan(user._id)
            .pipe(map((x) => 'R$ ' + this.stringUtil.numberToMoney(x.user))),
          description: this.metricsService
            .receivedValueNortan(user._id, 'Mês')
            .pipe(
              map((pastPayments) => {
                return (
                  this.metricsService.plural('Mês', 1) +
                  ' você recebeu R$ ' +
                  this.stringUtil.numberToMoney(pastPayments.user)
                );
              })
            ),
          loading: this.metricsService.receivedValueNortan(user._id).pipe(
            map((x) => x == undefined),
            startWith(true)
          ),
        });
        this.METRICS.push({
          title: 'Nº de IMPUL$$O$',
          tooltip:
            'Soma do valor líquido de todas as Ordens de Empenho pagas no mês',
          value: this.metricsService
            .receivedValueNortan(user._id)
            .pipe(map((x) => Math.trunc(x.global / 1000).toString())),
          description: this.metricsService
            .receivedValueNortan(user._id, 'Mês')
            .pipe(
              map((pastImpulses) => {
                return (
                  this.metricsService.plural('Mês', 1) +
                  ' a houveram ' +
                  Math.trunc(pastImpulses.global / 1000).toString()
                );
              })
            ),
          loading: this.metricsService.receivedValueNortan(user._id).pipe(
            map((x) => x == undefined),
            startWith(true)
          ),
        });
        this.METRICS.push({
          title: 'Contratos como gestor',
          tooltip:
            'Número de propostas de orçamento, criados por você, fechadas com o cliente no mês corrente',
          value: this.metricsService
            .contractsAsManger(user._id)
            .pipe(map((pastContracts) => pastContracts.count.toString())),
          description: this.metricsService
            .contractsAsManger(user._id, 'Mês')
            .pipe(
              map((pastContracts) => {
                return (
                  this.metricsService.plural('Mês', 1) +
                  ' você fechou ' +
                  (pastContracts.count == 0 ? 'nenhum' : pastContracts.count) +
                  (pastContracts.count > 1 ? ' contratos' : ' contrato')
                );
              })
            ),
          loading: this.metricsService.contractsAsManger(user._id).pipe(
            map((x) => x == undefined),
            startWith(true)
          ),
        });
        this.METRICS.push({
          title: 'Contratos como equipe',
          tooltip:
            'Número de propostas de orçamento, a qual você faz parte da equipe, fehcadas com o cliente no mês corrente',
          value: this.metricsService
            .contractsAsMember(user._id)
            .pipe(map((pastContracts) => pastContracts.count.toString())),
          description: this.metricsService
            .contractsAsMember(user._id, 'Mês')
            .pipe(
              map((pastContracts) => {
                return (
                  this.metricsService.plural('Mês', 1) +
                  ' você participou de ' +
                  (pastContracts.count == 0 ? 'nenhum' : pastContracts.count) +
                  (pastContracts.count > 1 ? ' contratos' : ' contrato')
                );
              })
            ),
          loading: this.metricsService.contractsAsMember(user._id).pipe(
            map((x) => x == undefined),
            startWith(true)
          ),
        });
        this.METRICS.push({
          title: 'Orçamentos como gestor',
          tooltip:
            'Número de propostas de orçamento criados por você no mês corrente',
          value: this.metricsService
            .invoicesAsManger(user._id)
            .pipe(map((pastInvoices) => pastInvoices.count.toString())),
          description: this.metricsService
            .invoicesAsManger(user._id, 'Mês')
            .pipe(
              map((pastInvoices) => {
                return (
                  this.metricsService.plural('Mês', 1) +
                  ' você enviou ' +
                  (pastInvoices.count == 0 ? 'nenhum' : pastInvoices.count) +
                  (pastInvoices.count > 1 ? ' orçamentos' : ' orçamento')
                );
              })
            ),
          loading: this.metricsService.invoicesAsManger(user._id).pipe(
            map((x) => x == undefined),
            startWith(true)
          ),
        });
        this.METRICS.push({
          title: 'Orçamentos como equipe',
          tooltip:
            'Número de propostas de orçamento que você faz parta da equipe no mês corrente',
          value: this.metricsService
            .invoicesAsMember(user._id)
            .pipe(map((pastInvoices) => pastInvoices.count.toString())),
          description: this.metricsService
            .invoicesAsMember(user._id, 'Mês')
            .pipe(
              map((pastInvoices) => {
                return (
                  this.metricsService.plural('Mês', 1) +
                  ' você participou de ' +
                  (pastInvoices.count == 0 ? 'nenhum' : pastInvoices.count) +
                  (pastInvoices.count > 1 ? ' orçamentos' : ' orçamento')
                );
              })
            ),
          loading: this.metricsService.invoicesAsMember(user._id).pipe(
            map((x) => x == undefined),
            startWith(true)
          ),
        });
        this.METRICS.push({
          title: 'Taxa de conversão (Gestor):\nOrçamento → Contrato',
          tooltip:
            'Porcentagem de orçamentos como gestor que foram fechados e viraram contratos no mês corrente (Orçamentos fechados/Orçamentos criados)',
          value: this.metricsService
            .invoicesToContracts('manager', user._id)
            .pipe(map((x) => this.stringUtil.numberToMoney(x) + '%')),
          description: this.metricsService
            .invoicesToContracts('manager', user._id, 'Mês')
            .pipe(
              map(
                (x) =>
                  this.metricsService.plural('Mês', 1) +
                  ' foi ' +
                  this.stringUtil.numberToMoney(x) +
                  '%'
              )
            ),
          loading: this.metricsService
            .invoicesToContracts('manager', user._id)
            .pipe(
              map((x) => x == undefined),
              startWith(true)
            ),
        });
        this.METRICS.push({
          title: 'Taxa de conversão (Membro):\nOrçamento → Contrato',
          tooltip:
            'Porcentagem de orçamentos como equipe que foram fechados e viraram contratos no mês corrente (Orçamentos participados Fechado / Orçamentos participados)',
          value: this.metricsService
            .invoicesToContracts('member', user._id)
            .pipe(map((x) => this.stringUtil.numberToMoney(x) + '%')),
          description: this.metricsService
            .invoicesToContracts('member', user._id, 'Mês')
            .pipe(
              map(
                (x) =>
                  this.metricsService.plural('Mês', 1) +
                  ' foi ' +
                  this.stringUtil.numberToMoney(x) +
                  '%'
              )
            ),
          loading: this.metricsService
            .invoicesToContracts('member', user._id)
            .pipe(
              map((x) => x == undefined),
              startWith(true)
            ),
        });
        this.METRICS.push({
          title:
            'Taxa de conversão de valores (Gestor):\nR$ Orçamento → R$ Contrato',
          tooltip:
            'Porcentagem de valor de orçamentos como gestor que foram fechados e viraram contratos no mês corrente (R$ Orçamentos Fechado / R$ Orçamentos criados)',
          value: this.metricsService
            .invoicesToContractsValue('manager', user._id)
            .pipe(map((x) => this.stringUtil.numberToMoney(x) + '%')),
          description: this.metricsService
            .invoicesToContractsValue('manager', user._id, 'Mês')
            .pipe(
              map(
                (x) =>
                  this.metricsService.plural('Mês', 1) +
                  ' foi ' +
                  this.stringUtil.numberToMoney(x) +
                  '%'
              )
            ),
          loading: this.metricsService
            .invoicesToContractsValue('manager', user._id)
            .pipe(
              map((x) => x == undefined),
              startWith(true)
            ),
        });
        this.METRICS.push({
          title:
            'Taxa de conversão de valores (Membro):\nR$ Orçamento → R$ Contrato',
          tooltip:
            'Porcentagem de valor de orçamentos como equipe que foram fechados e viraram contratos no mês corrente (R$ Orçamentos participados Fechado / R$ Orçamentos participados)',
          value: this.metricsService
            .invoicesToContractsValue('member', user._id)
            .pipe(map((x) => this.stringUtil.numberToMoney(x) + '%')),
          description: this.metricsService
            .invoicesToContractsValue('member', user._id, 'Mês')
            .pipe(
              map(
                (x) =>
                  this.metricsService.plural('Mês', 1) +
                  ' foi ' +
                  this.stringUtil.numberToMoney(x) +
                  '%'
              )
            ),
          loading: this.metricsService
            .invoicesToContractsValue('member', user._id)
            .pipe(
              map((x) => x == undefined),
              startWith(true)
            ),
        });
        for (const coord of this.departmentService.userCoordinations(
          user._id
        )) {
          this.METRICS.push({
            title: 'IMPUL$$O$ na ' + coord.split(' ')[0],
            tooltip:
              'Porcentagem do valor pago ao associado referente à ' +
              coord.split(' ')[0] +
              ' em relação a soma dos valores pagos à todos os associados desta coordenação no mês corrente (R$ recebido na coordenação / R$ recebido por todos associados da coordenação) ',
            value: this.metricsService
              .receivedValueByCoordinationsFiltered(user._id)
              .pipe(
                map((userCoord) =>
                  this.metricsService.userCoordRepresentation(coord, userCoord)
                )
              ),
            description: this.metricsService
              .receivedValueByCoordinationsFiltered(user._id, 'Mês', 1)
              .pipe(
                map(
                  (userCoord) =>
                    this.metricsService.plural('Mês', 1) +
                    ' foi ' +
                    this.metricsService.userCoordRepresentation(
                      coord,
                      userCoord
                    )
                )
              ),
            loading: this.metricsService
              .receivedValueByCoordinationsFiltered(user._id)
              .pipe(
                map((x) => x == undefined),
                startWith(true)
              ),
          });
        }
        for (const department of this.departmentService.userDepartments(
          user._id
        )) {
          this.METRICS.push({
            title: 'IMPUL$$O$ na ' + department,
            tooltip:
              'Porcentagem do valor pago ao associado referente à ' +
              department +
              ' em relação a soma dos valores pagos à todos os associados desta diretoria no mês corrente (R$ recebido na diretoria / R$ recebido por todos associados da diretoria) ',
            value: this.metricsService
              .receivedValueByDepartmentsFiltered(user._id)
              .pipe(
                map((userDepartment) =>
                  this.metricsService.userDepartmentRepresentation(
                    department,
                    userDepartment
                  )
                )
              ),
            description: this.metricsService
              .receivedValueByDepartmentsFiltered(user._id, 'Mês', 1)
              .pipe(
                map(
                  (userDepartment) =>
                    this.metricsService.plural('Mês', 1) +
                    ' foi ' +
                    this.metricsService.userDepartmentRepresentation(
                      department,
                      userDepartment
                    )
                )
              ),
            loading: this.metricsService
              .receivedValueByCoordinationsFiltered(user._id)
              .pipe(
                map((x) => x == undefined),
                startWith(true)
              ),
          });
        }
        this.METRICS.push({
          title: 'IMPUL$$O$ na Nortan',
          tooltip:
            'Porcentagem do valor total pago ao associado em relação ao valor pago a todos os associados Nortan, no mês corrente. (R$ total recebido / R$ total pago aos associados nortan)',
          value: this.metricsService
            .receivedValueNortan(user._id)
            .pipe(
              map((userGlobal) =>
                this.stringUtil.toPercentageNumber(
                  userGlobal.user,
                  userGlobal.global
                )
              )
            ),
          description: this.metricsService
            .receivedValueNortan(user._id, 'Mês', 1)
            .pipe(
              map(
                (userGlobal) =>
                  this.metricsService.plural('Mês', 1) +
                  ' foi ' +
                  this.stringUtil.toPercentageNumber(
                    userGlobal.user,
                    userGlobal.global
                  )
              )
            ),
          loading: this.metricsService.receivedValueNortan(user._id).pipe(
            map((x) => x == undefined),
            startWith(true)
          ),
        });
      }
    });
  }
}
