import { Component, OnInit } from '@angular/core';
import { MetricsService } from 'app/shared/services/metrics.service';
import { Observable, of } from 'rxjs';
import { UserService } from 'app/shared/services/user.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { DepartmentService } from 'app/shared/services/department.service';
import { take, map } from 'rxjs/operators';

interface MetricItem {
  title: string;
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
          title: 'Valor recebido',
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
          loading: this.metricsService
            .receivedValueNortan(user._id)
            .pipe(map((x) => x == undefined)),
        });
        this.METRICS.push({
          title: 'Valor repassado Nortan',
          value: this.metricsService
            .receivedValueNortan(user._id)
            .pipe(map((x) => 'R$ ' + this.stringUtil.numberToMoney(x.global))),
          description: this.metricsService
            .receivedValueNortan(user._id, 'Mês')
            .pipe(
              map((pastPayments) => {
                return (
                  this.metricsService.plural('Mês', 1) +
                  ' a Nortan repassou R$ ' +
                  this.stringUtil.numberToMoney(pastPayments.global)
                );
              })
            ),
          loading: this.metricsService
            .receivedValueNortan(user._id)
            .pipe(map((x) => x == undefined)),
        });
        this.METRICS.push({
          title: 'Contratos como gestor',
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
          loading: this.metricsService
            .contractsAsManger(user._id)
            .pipe(map((x) => x == undefined)),
        });
        this.METRICS.push({
          title: 'Contratos como membro',
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
          loading: this.metricsService
            .contractsAsMember(user._id)
            .pipe(map((x) => x == undefined)),
        });
        this.METRICS.push({
          title: 'Orçamentos como gestor',
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
          loading: this.metricsService
            .invoicesAsManger(user._id)
            .pipe(map((x) => x == undefined)),
        });
        this.METRICS.push({
          title: 'Orçamentos como membro',
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
          loading: this.metricsService
            .invoicesAsMember(user._id)
            .pipe(map((x) => x == undefined)),
        });
        this.METRICS.push({
          title: 'Taxa de conversão (Gestor):\nOrçamento → Contrato',
          value: this.metricsService
            .invoicesToContracts('manager', user._id, 'Mês', 3, true)
            .pipe(map((x) => x.toString() + '%')),
          description: of(this.metricsService.plural('Mês', 3)),
          loading: this.metricsService
            .invoicesToContracts('manager', user._id)
            .pipe(map((x) => x == undefined)),
        });
        this.METRICS.push({
          title: 'Taxa de conversão (Membro):\nOrçamento → Contrato',
          value: this.metricsService
            .invoicesToContracts('member', user._id, 'Mês', 3, true)
            .pipe(map((x) => x.toString() + '%')),
          description: of(this.metricsService.plural('Mês', 3)),
          loading: this.metricsService
            .invoicesToContracts('member', user._id)
            .pipe(map((x) => x == undefined)),
        });
        this.METRICS.push({
          title: 'Taxa de conversão de valores (Gestor):\nOrçamento → Contrato',
          value: this.metricsService
            .invoicesToContractsValue('manager', user._id, 'Mês', 3, true)
            .pipe(map((x) => x.toString() + '%')),
          description: of(this.metricsService.plural('Mês', 3)),
          loading: this.metricsService
            .invoicesToContractsValue('manager', user._id)
            .pipe(map((x) => x == undefined)),
        });
        this.METRICS.push({
          title: 'Taxa de conversão de valores (Membro):\nOrçamento → Contrato',
          value: this.metricsService
            .invoicesToContractsValue('member', user._id, 'Mês', 3, true)
            .pipe(map((x) => x.toString() + '%')),
          description: of(this.metricsService.plural('Mês', 3)),
          loading: this.metricsService
            .invoicesToContractsValue('member', user._id)
            .pipe(map((x) => x == undefined)),
        });
        for (const coord of this.departmentService.userCoordinations(
          user._id
        )) {
          this.METRICS.push({
            title: 'Representação na ' + coord.split(' ')[0],
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
              .pipe(map((x) => x == undefined)),
          });
        }
        for (const department of this.departmentService.userDepartments(
          user._id
        )) {
          this.METRICS.push({
            title: 'Representação na ' + department,
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
              .pipe(map((x) => x == undefined)),
          });
        }
        this.METRICS.push({
          title: 'Representação na Nortan',
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
          loading: this.metricsService
            .receivedValueNortan(user._id)
            .pipe(map((x) => x == undefined)),
        });
      }
    });
  }
}
