import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { combineLatest, filter, Observable, of } from 'rxjs';

import { numberToMoney } from 'app/shared/string-utils';

@Component({
  selector: 'ngx-gauge',
  templateUrl: './gauge.component.html',
  styleUrls: ['./gauge.component.scss'],
})
export class GaugeComponent implements AfterViewInit, OnDestroy {
  @Input() value$: Observable<number> = of(-1);
  @Input() name = '';
  @Input() max = 8000;
  options: any = {};
  themeSubscription: any;
  currentTheme = {};

  constructor(private theme: NbThemeService) {}

  ngOnDestroy(): void {
    this.themeSubscription.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.themeSubscription = combineLatest([this.theme.getJsTheme(), this.value$])
      .pipe(filter(([config, dataValue]) => dataValue > -1))
      .subscribe(([config, dataValue]) => {
        const colors: any = config.variables;
        this.currentTheme = colors.echarts;
        let color: string;
        if (dataValue <= this.max * 0.3125) color = colors.danger;
        else if (dataValue <= this.max * 0.625) color = colors.warning;
        else color = colors.success;

        this.options = {
          series: [
            {
              type: 'gauge',
              startAngle: 180,
              endAngle: 0,
              min: 0,
              max: this.max,
              radius: '170%',
              center: ['50%', '90%'],
              splitNumber: 8,
              axisLine: {
                show: false,
                lineStyle: {
                  width: 3,
                  color: [
                    [0.315, colors.danger],
                    [0.625, colors.warning],
                    [1, colors.success],
                  ],
                },
              },
              progress: {
                show: true,
                width: 3,
                itemStyle: {
                  color: color,
                },
              },
              pointer: {
                icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
                length: '12%',
                width: 20,
                offsetCenter: [0, '-60%'],
                itemStyle: {
                  color: 'auto',
                },
              },
              axisTick: {
                length: 6,
                distance: 2,
                lineStyle: {
                  color: 'auto',
                  width: 1,
                },
              },
              splitLine: {
                length: 10,
                distance: 2,
                lineStyle: {
                  color: 'auto',
                  width: 2,
                },
              },
              axisLabel: {
                fontSize: 8,
                distance: 7,
                formatter: this.formatter.bind(this),
              },
              title: {
                offsetCenter: [0, '-30%'],
                fontSize: 10,
              },
              detail: {
                fontSize: 16,
                offsetCenter: [0, '-10%'],
                valueAnimation: true,
                formatter: (value: number) => {
                  return numberToMoney(value);
                },
                color: color,
              },
              data: [
                {
                  value: dataValue,
                  name: this.name,
                },
              ],
            },
          ],
        };
      });
  }

  formatter(value: number) {
    if (this.max === value) {
      return (value / 1000).toFixed(1) + 'k';
    } else if (this.max * 0.875 === value) {
      return (value / 1000).toFixed(1) + 'k';
    } else if (this.max * 0.625 === value) {
      return (value / 1000).toFixed(1) + 'k';
    } else if (this.max * 0.375 === value) {
      return (value / 1000).toFixed(1) + 'k';
    } else if (this.max * 0.125 === value) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return '';
  }
}
