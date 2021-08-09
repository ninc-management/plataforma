import { AfterViewInit, Component, Input, OnDestroy } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { UtilsService } from 'app/shared/services/utils.service';
import { TimeSeries } from 'app/shared/services/metrics.service';
import { combineLatest, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'ngx-time-series',
  templateUrl: './time-series.component.html',
  styleUrls: ['./time-series.component.scss'],
})
export class TimeSeriesComponent implements AfterViewInit, OnDestroy {
  @Input() series$!: Observable<TimeSeries[]>;
  @Input() name = '';
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

  ngAfterViewInit(): void {
    this.themeSubscription = combineLatest([
      this.theme.getJsTheme(),
      this.series$,
    ])
      .pipe(filter(([config, series]) => series[0].data.length > 0))
      .subscribe(([config, series]) => {
        const colors: any = config.variables;
        this.currentTheme = colors.echarts;

        this.options = {
          tooltip: {
            trigger: 'axis',
            position: (pt: any) => {
              return [pt[0], '10%'];
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
          },
          yAxis: {
            type: 'value',
            boundaryGap: [0, '100%'],
          },
          dataZoom: [
            {
              type: 'inside',
              start: 0,
              end: 20,
            },
            {
              type: 'slider',
              start: 0,
              end: 20,
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
