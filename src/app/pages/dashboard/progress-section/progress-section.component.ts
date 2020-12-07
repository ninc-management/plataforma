import { Component, OnInit } from '@angular/core';
import { MetricsService } from 'app/shared/services/metrics.service';
import { Observable, of } from 'rxjs';
import { UserService } from 'app/shared/services/user.service';
import { take, map } from 'rxjs/operators';
import { StringUtilService } from 'app/shared/services/string-util.service';

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
  METRICS: MetricItem[] = new Array(9).fill({});

  constructor(
    private metricsService: MetricsService,
    private userService: UserService,
    private stringUtil: StringUtilService
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$.pipe(take(2)).subscribe((user) => {
      this.METRICS[0] = {
        title: 'Valor recebido',
        value: this.metricsService
          .receivedValue(user._id)
          .pipe(map((x) => 'R$ ' + this.stringUtil.numberToMoney(x))),
        description: this.metricsService.receivedValue(user._id, 'Mês').pipe(
          map((pastPayments) => {
            return (
              this.metricsService.plural('Mês', 1) +
              ' você recebeu R$ ' +
              this.stringUtil.numberToMoney(pastPayments)
            );
          })
        ),
        loading: this.metricsService
          .receivedValue(user._id)
          .pipe(map((x) => x == undefined)),
      };
      this.METRICS[1] = {
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
      };
      this.METRICS[2] = {
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
      };
      this.METRICS[3] = {
        title: 'Orçamentos como gestor',
        value: this.metricsService
          .invoicesAsManger(user._id)
          .pipe(map((pastInvoices) => pastInvoices.count.toString())),
        description: this.metricsService.invoicesAsManger(user._id, 'Mês').pipe(
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
      };
      this.METRICS[4] = {
        title: 'Orçamentos como membro',
        value: this.metricsService
          .invoicesAsMember(user._id)
          .pipe(map((pastInvoices) => pastInvoices.count.toString())),
        description: this.metricsService.invoicesAsMember(user._id, 'Mês').pipe(
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
      };
      this.METRICS[5] = {
        title: 'Taxa de conversão (Gestor):\nOrçamento → Contrato',
        value: this.metricsService
          .invoicesToContracts('manager', user._id, 'Mês', 3, true)
          .pipe(map((x) => x.toString() + '%')),
        description: of(this.metricsService.plural('Mês', 3)),
        loading: this.metricsService
          .invoicesToContracts('manager', user._id)
          .pipe(map((x) => x == undefined)),
      };
      this.METRICS[6] = {
        title: 'Taxa de conversão (Membro):\nOrçamento → Contrato',
        value: this.metricsService
          .invoicesToContracts('member', user._id, 'Mês', 3, true)
          .pipe(map((x) => x.toString() + '%')),
        description: of(this.metricsService.plural('Mês', 3)),
        loading: this.metricsService
          .invoicesToContracts('member', user._id)
          .pipe(map((x) => x == undefined)),
      };
      this.METRICS[7] = {
        title: 'Taxa de conversão de valores (Gestor):\nOrçamento → Contrato',
        value: this.metricsService
          .invoicesToContractsValue('manager', user._id, 'Mês', 3, true)
          .pipe(map((x) => x.toString() + '%')),
        description: of(this.metricsService.plural('Mês', 3)),
        loading: this.metricsService
          .invoicesToContractsValue('manager', user._id)
          .pipe(map((x) => x == undefined)),
      };
      this.METRICS[8] = {
        title: 'Taxa de conversão de valores (Membro):\nOrçamento → Contrato',
        value: this.metricsService
          .invoicesToContractsValue('member', user._id, 'Mês', 3, true)
          .pipe(map((x) => x.toString() + '%')),
        description: of(this.metricsService.plural('Mês', 3)),
        loading: this.metricsService
          .invoicesToContractsValue('member', user._id)
          .pipe(map((x) => x == undefined)),
      };
    });
  }
}
