import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { UtilsService } from 'app/shared/services/utils.service';
import { TimeSeries } from 'app/shared/services/metrics.service';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { cloneDeep } from 'lodash';
import { addDays, format, isSameDay, startOfMonth } from 'date-fns';

@Component({
  selector: 'ngx-time-series',
  templateUrl: './time-series.component.html',
  styleUrls: ['./time-series.component.scss'],
})
export class TimeSeriesComponent implements AfterViewInit, OnDestroy {
  @Input() series$!: Observable<TimeSeries[]>;
  @Input() name = '';
  currentTimeSeries: TimeSeries[] = [];
  echartsInstance: any;
  options: any = {};
  themeSubscription: any;
  lang = {
    locale: 'PT-BR',
  };
  currentTheme = {};

  constructor(private theme: NbThemeService, private utils: UtilsService) {}

  ngOnDestroy(): void {
    this.themeSubscription.unsubscribe();
  }

  onChartInit(event: any): void {
    this.echartsInstance = event;
  }

  ngAfterViewInit(): void {
    this.themeSubscription = combineLatest([
      this.theme.getJsTheme(),
      this.series$,
    ])
      .pipe(filter(([config, series]) => series[0].data.length > 0))
      .subscribe(([config, series]) => {
        const colors: any = config.variables;
        this.currentTheme = colors.echarts;
        this.currentTimeSeries = cloneDeep(series);

        this.options = {
          tooltip: {
            trigger: 'axis',
            position: (
              pos: any,
              params: any,
              dom: any,
              rect: any,
              size: any
            ) => {
              // tooltip will be fixed on the right if mouse hovering on the left,
              // and on the left if h: anyovering on the right.
              let obj: any = { top: '5%' };
              const mouseX = pos[0];
              const tooltipWidth = size.contentSize[0];
              const canvasWidth = size.viewSize[0];
              console.log(mouseX, tooltipWidth, canvasWidth);

              let left = 0;
              if (
                mouseX >= Math.round(tooltipWidth / 2) &&
                mouseX <= canvasWidth - Math.round(tooltipWidth / 2)
              )
                left = mouseX - Math.round(tooltipWidth / 2);
              if (mouseX > canvasWidth - Math.round(tooltipWidth / 2))
                left = canvasWidth - tooltipWidth;
              obj['left'] = left;

              return obj;
            },
            formatter: (params: any) => {
              params.sort(function (a: any, b: any) {
                return parseInt(b.value[1]) - parseInt(a.value[1]);
              });
              const date = params[0].data[0];
              let output =
                '<div style="text-align:center">' +
                this.utils.formatDate(new Date(date)) +
                '</div>';
              for (let i = 0; i < params.length; i++) {
                output +=
                  '<div style="display: flex; justify-content: space-between"><span>' +
                  params[i].marker +
                  params[i].seriesName +
                  ':&nbsp </span><span><b>' +
                  params[i].value[1] +
                  '</b></span></div>';
              }
              return output;
            },
          },
          title: {
            left: 'center',
            text: this.name,
          },
          toolbox: {
            feature: {
              dataZoom: {
                yAxisIndex: 'none',
              },
              restore: {},
              saveAsImage: {},
            },
          },
          xAxis: {
            type: 'time',
            boundaryGap: false,
            min: '2020/01/01',
            max: format(new Date(), 'yyyy/MM/dd'),
          },
          yAxis: {
            type: 'value',
            boundaryGap: [0, '100%'],
          },
          dataZoom: [
            {
              type: 'inside',
              startValue: startOfMonth(new Date()),
              endValue: new Date(),
              rangeMode: 'value',
            },
            {
              type: 'slider',
              startValue: startOfMonth(new Date()),
              endValue: new Date(),
              rangeMode: 'value',
              labelFormatter: (value: Date): string => {
                return this.utils.formatDate(value);
              },
            },
          ],
          series: series,
        };
      });
  }
}
