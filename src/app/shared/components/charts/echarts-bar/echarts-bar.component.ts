import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { EChartsOption } from 'echarts';
import { Subject, take, takeUntil } from 'rxjs';

import { ContractService } from 'app/shared/services/contract.service';
import { StringUtilService } from 'app/shared/services/string-util.service';

type EchartBarItem = [string, number];

interface EchartBar {
  type: 'bar';
  barWidth: string;
  barGap: string;
  data: EchartBarItem[];
}

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
  series: EchartBar[] = [];
  private destroy$: Subject<void> = new Subject();
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  toHandleChart(series: EchartBar[]) {
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
          axisLabel: {
            width: 100,
            interval: 0,
            rotate: 30,
          },
          axisTick: {
            alignWithLabel: true,
          },
        },
      ],
      yAxis: [
        {
          type: 'value',
        },
      ],
      series: series,
    };
  }

  ngOnInit(): void {
    this.theme
      .getJsTheme()
      .pipe(take(1))
      .subscribe((config) => {
        const colors: any = config.variables;
        this.currentTheme = colors.echarts;
        this.contractService
          .getContracts()
          .pipe(takeUntil(this.destroy$))
          .subscribe((contracts) => {
            const series: EchartBar[] = [];
            const currentContract = contracts.find((contract) => contract._id === this.contractId);
            if (currentContract) {
              this.contractService
                .expenseTypesSum(false, currentContract)
                .pipe(take(1))
                .subscribe((result) => {
                  result
                    .filter((x) => x.type !== 'TOTAL')
                    .map((expense) => {
                      const temp: EchartBar = {
                        type: 'bar',
                        barGap: '-100%',
                        barWidth: '30%',
                        data: [[expense.type, this.stringUtilService.moneyToNumber(expense.value)]],
                      };
                      series.push(temp);
                    });
                  this.toHandleChart(series);
                });
            }
          });
      });
  }
}
