import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { ContractService } from 'app/shared/services/contract.service';
import { StringUtilService } from 'app/shared/services/string-util.service';
import { Subject } from 'rxjs';
import { EChartsOption } from 'echarts';

@Component({
  selector: 'ngx-echarts-bar',
  templateUrl: './echarts-bar.component.html',
  styleUrls: ['./echarts-bar.component.scss'],
})
export class EchartsBarComponent implements OnInit, OnDestroy {
  @Input() contractId!: string;
  echartsInstance: any;
  options: EChartsOption = {};
  updateOptions: EChartsOption = {};
  expenseTypes: string[] = [];
  expenseValues: number[] = [];
  private destroy$: Subject<void> = new Subject();
  themeSubscription: any;
  currentTheme = {};
  constructor(
    private theme: NbThemeService,
    private stringUtilService: StringUtilService,
    private contractService: ContractService
  ) {}

  onChartInit(event: any): void {
    this.echartsInstance = event;
  }

  ngOnDestroy(): void {
    this.themeSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.themeSubscription = this.theme.getJsTheme().subscribe((config) => {
      const colors: any = config.variables;
      this.currentTheme = colors.echarts;
      this.contractService.getContracts().subscribe((contracts) => {
        this.expenseTypes = [];
        this.expenseValues = [];
        const currentContract = contracts.find((contract) => contract._id === this.contractId);

        if (currentContract) {
          const result = this.contractService.expenseTypesSum(false, currentContract);
          result
            .filter((x) => x.type !== 'TOTAL')
            .map((expense) => {
              this.expenseTypes.push(expense.type);
              this.expenseValues.push(this.stringUtilService.moneyToNumber(expense.value));
              this.updateOptions = {
                xAxis: [{ data: this.expenseTypes }],
                series: [{ data: this.expenseValues }],
              };
            });
        }
      });
      this.options = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        },
        xAxis: [
          {
            type: 'category',
            data: this.expenseTypes,
            axisLabel: {
              width: 100,
              interval: 0,
            },
            axisTick: {
              alignWithLabel: true,
            },
          },
        ],
        yAxis: [
          {
            type: 'value',
            axisLabel: {},
          },
        ],
        series: [
          {
            name: 'Total:',
            type: 'bar',
            barWidth: '30%',
            data: this.expenseValues,
          },
        ],
      };
    });
  }
}
