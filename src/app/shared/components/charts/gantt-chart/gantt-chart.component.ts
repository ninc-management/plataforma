// This code was initially made by https://github.com/mfandre

import {
  AfterContentChecked,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { NbJSThemeVariable, NbThemeService } from '@nebular/theme';
import { UtilsService } from 'app/shared/services/utils.service';
import * as echarts from 'echarts/core';
import { DateManipulator } from './date-manipulator';
import { GanttRenderers } from './gantt-renderers';
import { TaskDataManipulator } from './task-data-manipulator';
import { TaskModel } from './task-data.model';

export interface ChartTheme {
  palette: string[];
  variables: NbJSThemeVariable;
}

@Component({
  selector: 'ngx-gantt-chart',
  templateUrl: './gantt-chart.component.html',
  styleUrls: ['./gantt-chart.component.scss'],
})
export class GanttChartComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
  @ViewChild('wrapper') wrapper: ElementRef | undefined;
  @ViewChild('gantt') gantt: ElementRef | undefined;

  @Input()
  public taskData: TaskModel[] = [];

  @Output()
  public taskDataChange: EventEmitter<TaskModel[]> = new EventEmitter<TaskModel[]>();
  //this.dataChange.emit(this.size);

  @Output()
  public editClicked: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  public taskClicked: EventEmitter<TaskModel> = new EventEmitter<TaskModel>();
  /**
   * The scroll will stop to work... its a bug that I cant figure it out :(
   */

  @Input()
  public chartTitle: string = '';

  @Input()
  public dateFormat: string = '{MM}/{dd}/{yyyy}';

  @Input()
  public heightRatio: number = 0.6;

  @Input()
  public loading: boolean = false;

  @Input()
  public height: number = 300;

  /**
   * constiable to control chart
   */
  ganttWidth: number = 700;

  ganttHeight: number = 500;

  chartOptions: any;

  echartsInstance: any;
  themeSubscription: any;
  currentTheme: ChartTheme = {
    palette: [],
    variables: {},
  };

  private renderers!: GanttRenderers;
  private taskDataManipulator!: TaskDataManipulator;
  private mappedData!: any[];
  private zebraData!: any[];
  private todayData!: any[];

  constructor(private theme: NbThemeService, private utils: UtilsService) {}

  getTitleOption(): any {
    if (this.chartTitle === '') return {};

    return {
      text: this.chartTitle,
      textStyle: {
        color: '#fff',
      },
      left: 'center',
    };
  }

  getGridOption(): any {
    return {
      show: true,
      top: 70,
      bottom: 20,
      left: 225,
      right: 20,
      //height: '1000px',
      backgroundColor: '#fff',
      borderWidth: 0,
    };
  }

  getTooltipOption(): any {
    const DATE_FORMAT = this.dateFormat;
    return {
      confine: true,
      appendToBody: true,
      trigger: 'item',
      formatter: function (info: any) {
        //removing tooltip from the lines
        if (info != undefined && info.seriesIndex != 2) {
          return '';
        }
        //console.log("info", info)
        const value = info.value;

        const taskName = value[1];
        const start = echarts.time.format(new Date(value[2]), DATE_FORMAT, false);
        const end = echarts.time.format(new Date(value[3]), DATE_FORMAT, false);
        const progressPercentage = value[5];
        const isFinished = value[11];
        const isAction = value[12];

        let text = '';
        if (isAction) {
          text = isFinished ? 'Ação finalizada' : DateManipulator.daysLeft(value[3]);
        } else {
          //if the progress is 100 but item isn't finished
          //the progress bar remains full but in red color
          text = isFinished
            ? 'Item finalizado'
            : (progressPercentage == 100 ? 0 : progressPercentage) + '% ' + 'de ações feitas';
        }

        return [
          '<div class="tooltip-title">' + echarts.format.encodeHTML(taskName) + '</div>',
          start + ' - ',
          end + '<br>',
          text,
        ].join('');
      },
    };
  }

  editAction(): void {
    this.editClicked.emit(true);
  }

  getToolboxOption(): any {
    return {
      left: 0,
      feature: {
        dataZoom: {
          yAxisIndex: 'none',
        },
        restore: {},
      },
    };
  }

  getXAxisOption(): any {
    return {
      type: 'time',
      position: 'top',
      splitLine: {
        lineStyle: {
          color: ['#E9EDFF'],
        },
      },
      axisLine: {
        show: false,
      },
      axisTick: {
        lineStyle: {
          color: '#929ABA',
        },
      },
      axisLabel: {
        color: '#929ABA',
        inside: false,
        align: 'center',
        formatter: this.formatLabelDate.bind(this),
      },
    };
  }

  formatLabelDate(value: Date, index: number): string {
    const valueDate = new Date(value);

    const dayToday = valueDate.getDate();
    const monthToday = valueDate.getMonth();
    if (this.isFirstDay(dayToday, monthToday)) {
      return this.getMonthName(monthToday);
    }
    return dayToday + '';
    /*const DATE_FORMAT = this.dateFormat
    return echarts.time.format(
        value,
        DATE_FORMAT,
        false
    );*/
  }

  /**
   *
   * @param dayToday day reference to check if is the last day of the month
   * @param month (0-11) month reference to check if the day passed is the last day of the month.
   * @returns true if day is the last day of the month. False otherwise
   */
  getLastDayMonth(dayToday: number, month: number): boolean {
    //const month = 0; // January
    const d = new Date(new Date().getFullYear(), month + 1, 0).getDate();

    return d == dayToday;
  }

  isFirstDay(dayToday: number, month: number): boolean {
    return dayToday == 1;
  }

  getMonthName(month: number): string {
    switch (month) {
      case 0:
        return 'Jan';
      case 1:
        return 'Fev';
      case 2:
        return 'Mar';
      case 3:
        return 'Abr';
      case 4:
        return 'Mai';
      case 5:
        return 'Jun';
      case 6:
        return 'Jul';
      case 7:
        return 'Ago';
      case 8:
        return 'Set';
      case 9:
        return 'Out';
      case 10:
        return 'Nov';
      case 11:
        return 'Dez';
    }
    return '';
  }

  getYAxisOption(): any {
    return {
      axisTick: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisLabel: { show: false },
      min: 0,
      max: this.taskData.length,
    };
  }

  getSerieZebra(): any {
    const _zebraDataDimensions = [
      { name: 'index', type: 'number' },
      { name: 'start', type: 'time' },
      { name: 'end', type: 'time' },
      { name: 'taskId', type: 'number' },
    ];
    return {
      id: 'zebra',
      type: 'custom',
      renderItem: this.renderers.renderZebra.bind(this.renderers),
      dimensions: _zebraDataDimensions,
      encode: {
        x: -1, //[1, 2],
        y: 3, //reference of taskid
      },
      data: this.zebraData, //Im changing the item object to array... this is why the encode is filled with indexed
    };
  }

  getSerieArrow(taskDataDimensions: any[]): any {
    return {
      id: 'arrow',
      type: 'custom',
      clip: true,
      silent: true,
      itemStyle: {
        borderType: 'dashed',
      },
      renderItem: this.renderers.renderArrowsItem.bind(this.renderers),
      dimensions: taskDataDimensions,
      tooltip: null,
      encode: {
        x: -1, // Then this series will not controlled by x.
        y: 4, //reference of taskid
      },
      data: this.mappedData, //Im changing the item object to array... this is why the encode is filled with indexed
    };
  }

  getSerieGantt(taskDataDimensions: any[]): any {
    return {
      id: 'taskData',
      type: 'custom',
      itemStyle: {},
      renderItem: this.renderers.renderGanttItem.bind(this.renderers),
      dimensions: taskDataDimensions,
      encode: {
        x: [2, 3],
        y: 4, //reference of taskid
        tooltip: [0, 1, 2],
      },
      data: this.mappedData, //Im changing the item object to array... this is why the encode is filled with indexed
    };
  }

  getSerieAxisY(taskDataDimensions: any[]): any {
    return {
      type: 'custom',
      renderItem: this.renderers.renderAxisLabelItem.bind(this.renderers),
      dimensions: taskDataDimensions,
      encode: {
        x: -1, // Then this series will not controlled by x.
        y: 4, //reference of taskid
        tooltip: [0, 1, 2],
      },
      data: this.mappedData, //Im changing the item object to array... this is why the encode is filled with indexed
    };
  }

  getSerieToday(): any {
    return {
      id: 'today',
      type: 'custom',
      renderItem: this.renderers.renderToday.bind(this.renderers),
      dimensions: [{ name: 'today', type: 'time' }],
      encode: {
        x: 0,
        y: -1, //reference of taskid
      },
      data: this.todayData,
    };
  }

  getDataZoom(): any[] {
    return [
      {
        type: 'slider',
        rangeMode: 'value',
        top: 3,
        start: 0,
        end: 100,
        labelFormatter: (value: Date): string => {
          return this.utils.formatDate(value);
        },
      },
      {
        type: 'inside',
        id: 'insideX',
        xAxisIndex: 0,
        filterMode: 'weakFilter',
        start: 0,
        end: 30,
        zoomOnMouseWheel: false,
        moveOnMouseMove: false,
        moveOnMouseWheel: true,
        preventDefaultMouseMove: false,
        preventDefaultMouseWheel: false,
      },
    ];
  }

  getSeries(): any[] {
    const taskDataDimensions = [
      { name: 'index', type: 'number' },
      { name: 'taskName', type: 'ordinal' },
      { name: 'start', type: 'time' },
      { name: 'end', type: 'time' },
      { name: 'taskId', type: 'number' },
      { name: 'progressPercentage', type: 'number' },
      { name: 'owner', type: 'ordinal' },
      { name: 'image', type: 'ordinal' },
      { name: 'groupName', type: 'ordinal' },
      { name: 'isToDrawGroup', type: 'number' },
      { name: 'groupColor', type: 'ordinal' },
      { name: 'isFinished', type: 'number' },
      { name: 'isAction', type: 'number' },
    ];
    return [
      this.getSerieZebra(),
      this.getSerieArrow(taskDataDimensions),
      this.getSerieGantt(taskDataDimensions),
      this.getSerieAxisY(taskDataDimensions),
      this.getSerieToday(),
    ];
  }

  setChartOptions(): void {
    this.chartOptions = {
      backgroundColor: 'transparent',
      tooltip: this.getTooltipOption(),
      animation: false,
      toolbox: this.getToolboxOption(),
      title: this.getTitleOption(),
      dataZoom: this.getDataZoom(),
      grid: this.getGridOption(),
      xAxis: this.getXAxisOption(),
      yAxis: this.getYAxisOption(),
      series: this.getSeries(),
    };
  }

  ngOnDestroy(): void {
    this.themeSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.themeSubscription = this.theme.getJsTheme().subscribe((config: any) => {
      this.currentTheme = {
        palette: config.variables.echarts?.color,
        variables: config.variables,
      } as ChartTheme;

      this.taskDataManipulator = new TaskDataManipulator(this.currentTheme.palette);
      this.taskData = this.taskData.sort(this.taskDataManipulator.compareTasks);
      //after sort we map to maintain the order
      this.mappedData = this.taskDataManipulator.mapData(this.taskData);
      this.zebraData = this.taskDataManipulator.mapZebra(this.taskData);
      this.renderers = new GanttRenderers(this.taskData, this.mappedData, this.heightRatio, this.currentTheme);
      this.setChartOptions();
    });
    this.todayData = [new Date()];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.echartsInstance) {
      this.echartsInstance.clear();
    }
    this.taskDataManipulator = new TaskDataManipulator(this.currentTheme.palette);
    this.taskData = this.taskData.sort(this.taskDataManipulator.compareTasks);

    //after sort we map to maintain the order
    this.mappedData = this.taskDataManipulator.mapData(this.taskData);
    this.zebraData = this.taskDataManipulator.mapZebra(this.taskData);
    this.todayData = [new Date()];
    this.renderers = new GanttRenderers(this.taskData, this.mappedData, this.heightRatio, this.currentTheme);
    this.setChartOptions();
  }

  ngAfterContentChecked(): void {
    if (this.wrapper == undefined) return;

    this.ganttWidth = this.wrapper?.nativeElement.offsetWidth;
    this.ganttHeight = this.wrapper?.nativeElement.offsetHeight;

    const chartHeight = this.taskData.length * 80;
    this.ganttHeight = chartHeight < 300 ? 300 : chartHeight;
  }

  onTaskClicked(params: any) {
    if (params != undefined) {
      const task = this.taskDataManipulator.getTaskById(this.taskData, params.value[4]);
      if (task) this.taskClicked.emit(task);
    }
  }

  onChartInit(ec: any) {
    this.echartsInstance = ec;
    this.echartsInstance.resize();
  }

  resizeChart() {
    if (this.echartsInstance) {
      this.echartsInstance.resize();
    }
  }

  @HostListener('window:resize', ['$event'])
  sizeChange(event: any) {
    this.resizeChart();
  }
}
