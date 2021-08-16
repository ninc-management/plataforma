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

  handleCumulativeSeries(
    series: TimeSeries[],
    start: Date,
    end: Date
  ): TimeSeries[] {
    let lastValue = 0;
    return cloneDeep(series).map((serie) => {
      if (!serie.cumulative) return serie;
      serie.data = serie.data
        .filter((seriesItem) =>
          this.utils.isWithinInterval(new Date(seriesItem[0]), start, end)
        )
        .map((seriesItem) => {
          const accumulated = seriesItem[1] + lastValue;
          lastValue = accumulated;
          return [seriesItem[0], accumulated];
        });
      const timeSeriesItems = serie.data;
      if (timeSeriesItems.length == 0) {
        timeSeriesItems.push([format(start, 'yyyy/MM/dd'), 0]);
        timeSeriesItems.push([format(end, 'yyyy/MM/dd'), 0]);
      } else {
        if (!isSameDay(new Date(timeSeriesItems[0][0]), start))
          timeSeriesItems.unshift([format(start, 'yyyy/MM/dd'), 0]);
        if (
          !isSameDay(
            new Date(timeSeriesItems[timeSeriesItems.length - 1][0]),
            end
          )
        )
          timeSeriesItems.push([
            format(end, 'yyyy/MM/dd'),
            timeSeriesItems[timeSeriesItems.length - 1][1],
          ]);
      }
      serie.data = timeSeriesItems;
      return serie;
    });
  }

  onDataZoom(): void {
    const currentOptions = this.echartsInstance.getOption();
    const dataZoom = currentOptions.dataZoom[0];
    const zoomStart: Date = addDays(new Date(dataZoom.startValue), 1);
    const zoomEnd: Date = dataZoom.endValue;

    this.handleCumulativeSeries(
      this.currentTimeSeries,
      zoomStart,
      zoomEnd
    ).forEach((serie, index) => {
      currentOptions.series[index].data = serie.data;
    });

    this.echartsInstance.setOption(currentOptions);
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
        const zoomStart: Date = startOfMonth(new Date());
        const zoomEnd: Date = new Date();

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
              startValue: zoomStart,
              endValue: zoomEnd,
              rangeMode: 'value',
            },
            {
              type: 'slider',
              startValue: zoomStart,
              endValue: zoomEnd,
              rangeMode: 'value',
              labelFormatter: (value: Date): string => {
                return this.utils.formatDate(value);
              },
            },
          ],
          series: this.handleCumulativeSeries(series, zoomStart, zoomEnd),
        };
      });
  }
}
