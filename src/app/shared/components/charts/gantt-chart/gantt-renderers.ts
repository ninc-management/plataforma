// This code was initially made by https://github.com/mfandre

import { Contract } from '@models/contract';
import { isAfter } from 'date-fns';
import * as echarts from 'echarts/core';
import { daysLeft } from './date-manipulator';
import { ChartTheme } from './gantt-chart.component';
import { TaskDataManipulator } from './task-data-manipulator';
import { TaskModel } from './task-data.model';

export enum ChartConstants {
  ZOOM_BOX_OFFSET = 70,
  DEFAULT_BAR_HEIGHT = 70,
  ITEM_HEIGHT = 50,
  ITEM_OFFSET = 10,
  LABEL_HEIGHT = 46,
  LABEL_OFFSET = (DEFAULT_BAR_HEIGHT - LABEL_HEIGHT) / 2,
}

export class GanttRenderers {
  private _taskData: TaskModel[];
  private _mappedData: any[];
  private taskDataManipulator: TaskDataManipulator;
  private _currentTheme: ChartTheme;

  constructor(taskData: TaskModel[], mappedData: any[], currentTheme: ChartTheme, contract: Contract) {
    this._taskData = taskData;
    this._mappedData = mappedData;
    this._currentTheme = currentTheme;
    this.taskDataManipulator = new TaskDataManipulator(this._currentTheme.palette, contract);
  }

  renderGanttItem(params: any, api: any) {
    const index = api.value(0);
    const taskName = api.value(1);
    const timeStart = api.coord([api.value(2), index]);
    const timeEnd = api.coord([api.value(3), index]);
    const progressPercentage = api.value(5);
    const groupColor = api.value(10);
    const isFinished = api.value(11);
    const isAction = api.value(12);
    const barLength = timeEnd[0] - timeStart[0];

    const x = timeStart[0];
    const y = ChartConstants.DEFAULT_BAR_HEIGHT * (index + 1) + ChartConstants.ITEM_OFFSET;
    const taskNameWidth = echarts.format.getTextRect(taskName).width;
    const text = barLength > taskNameWidth + 40 && x + barLength >= 180 ? taskName : '';

    const rectNormal = this.clipRectByRect(params, {
      x: x,
      y: y,
      width: barLength,
      height: ChartConstants.ITEM_HEIGHT,
    });
    const rectText = this.clipRectByRect(params, {
      x: x,
      y: y,
      width: barLength,
      height: ChartConstants.ITEM_HEIGHT,
    });
    const rectPercent = this.clipRectByRect(params, {
      x: x,
      y: y,
      width: (barLength * progressPercentage) / 100,
      height: 3,
    });

    const itemGroup = {
      type: 'group',
      children: [
        {
          type: 'rect',
          ignore: !rectNormal,
          shape: rectNormal,
          style: api.style({
            fill: groupColor,
          }),
        },
        {
          type: 'rect',
          ignore: !rectText,
          shape: rectText,
          style: api.style({
            fill: 'transparent',
            stroke: 'transparent',
            text: text,
            textFill: '#000',
            fontFamily: this._currentTheme.variables.fontMain,
            fontWeight: 600,
          }),
        },
        {
          type: 'rect',
          ignore: !rectPercent,
          shape: rectPercent,
          style: api.style({
            fill: this.progressLineColor(isFinished, progressPercentage),
            stroke: 'transparent',
          }),
        },
      ],
    };

    if (isAction && isFinished) {
      const rectFinished = this.createFinishedRect(params, api);
      const actionEndDate = new Date(api.value(3));
      const finishedDate = new Date(api.value(13));

      if (isAfter(finishedDate, actionEndDate)) {
        //make the text rect size the same as the finished rect
        itemGroup.children[1].shape = rectFinished.shape;
        itemGroup.children[1].ignore = !rectFinished.shape;
        //make the progress line width the same as the rect finished
        itemGroup.children[2].shape.width = rectFinished.shape.width;
        itemGroup.children[2].ignore = !rectFinished.shape;
        itemGroup.children.splice(0, 0, rectFinished);
      } else {
        //swap colors between base rect and finished rect
        const tmpStyle = itemGroup.children[0].style;
        itemGroup.children[0].style = rectFinished.style;
        rectFinished.style = tmpStyle;
        itemGroup.children.splice(1, 0, rectFinished);
      }
    }

    return itemGroup;
  }

  renderAxisLabelItem(params: any, api: any) {
    const index = api.value(0);
    const taskName = api.value(1);
    const end = api.value(3);
    const image = api.value(7);
    const groupName = api.value(8);
    const shouldDrawGroupConnector = api.value(9);
    const groupColor = api.value(10);
    const isFinished = api.value(11);

    const y = ChartConstants.DEFAULT_BAR_HEIGHT * (index + 1) + ChartConstants.LABEL_OFFSET;

    const groupedElement = {
      type: 'group',
      silent: true,
      children: [
        {
          type: 'rect',
          shape: { x: 10, y: y, width: 210, height: ChartConstants.LABEL_HEIGHT },
          style: {
            fill: groupColor,
          },
        },
        {
          type: 'image',
          style: {
            image: image,
            x: 10,
            y: y,
            width: ChartConstants.LABEL_HEIGHT,
            height: ChartConstants.LABEL_HEIGHT,
          },
        },
        {
          type: 'text',
          style: {
            x: 63,
            y: y + 24,
            text: taskName,
            textVerticalAlign: 'bottom',
            textAlign: 'left',
            textFill: '#000',
            fontFamily: this._currentTheme.variables.fontMain,
            fontWeight: 600,
            fontSize: 12,
          },
        },
        {
          type: 'text',
          style: {
            x: 63,
            y: y + 38,
            textVerticalAlign: 'bottom',
            textAlign: 'left',
            text: isFinished ? 'Finalizado' : daysLeft(end),
            textFill: '#000',
            fontSize: 11,
            fontFamily: this._currentTheme.variables.fontMain,
            fontWeight: 600,
          },
        },
      ],
    };

    if (shouldDrawGroupConnector == 1) {
      groupedElement.children.push({
        type: 'rect',
        shape: { x: 115, y: y - ChartConstants.LABEL_OFFSET * 2, width: 10, height: ChartConstants.LABEL_OFFSET * 2 },
        style: {
          fill: groupColor,
        },
      });
    } else {
      groupedElement.children.push({
        type: 'text',
        style: {
          x: 0,
          y: y,
          text: groupName,
          textVerticalAlign: 'bottom',
          textAlign: 'left',
          textFill: this._currentTheme.variables.fgText as string,
          fontFamily: this._currentTheme.variables.fontMain,
          fontWeight: 600,
          fontSize: 12,
        },
      });
    }

    return groupedElement;
  }

  renderArrowsItem(params: any, api: any) {
    const index = api.value(0);
    const timeStart = api.coord([api.value(2), index]);
    const x = timeStart[0];
    const y = ChartConstants.DEFAULT_BAR_HEIGHT * (index + 1);

    //the api.value only suports numeric and string values to get... to get taskDependencies I need to get from my real data constiable
    const currentData = this._taskData[params.dataIndex];
    const taskDependencies = currentData.taskDependencies;

    const links = [];
    const dependencies = taskDependencies;
    for (let j = 0; j < dependencies.length; j++) {
      const taskFather = this.taskDataManipulator.getTaskByIdInMappedData(this._mappedData, dependencies[j]);
      if (taskFather == null) continue;

      const indexFather = taskFather[0];
      const timeStartFather = api.coord([taskFather[2], indexFather]);
      const timeEndFather = api.coord([taskFather[3], indexFather]);
      const barLengthFather = timeEndFather[0] - timeStartFather[0];
      const xFather = timeStartFather[0];
      const yFather = ChartConstants.DEFAULT_BAR_HEIGHT * (indexFather + 1);

      let arrow = {};
      const ARROW_SIZE = 5;
      //condition to draw the arrow correctly when a dependent task is exactly below another task
      if (x < ARROW_SIZE + xFather + barLengthFather / 20) {
        arrow = {
          type: 'polygon',
          shape: {
            points: [
              [xFather + barLengthFather / 20 - ARROW_SIZE, y - 10],
              [xFather + barLengthFather / 20 + ARROW_SIZE, y - 10],
              [xFather + barLengthFather / 20, y],
            ],
          },
          style: api.style({
            fill: this._currentTheme.variables.fgText,
          }),
        };
      } else {
        //draw normaly
        arrow = {
          type: 'polygon',
          shape: {
            points: [
              [x - 10, y + ChartConstants.DEFAULT_BAR_HEIGHT / 2 - ARROW_SIZE],
              [x - 10, y + ChartConstants.DEFAULT_BAR_HEIGHT / 2 + ARROW_SIZE],
              [x, y + ChartConstants.DEFAULT_BAR_HEIGHT / 2],
            ],
          },
          style: api.style({
            fill: this._currentTheme.variables.fgText,
          }),
        };
      }

      const verticalLine = {
        type: 'line',
        shape: {
          x1: xFather + barLengthFather / 20,
          y1: yFather + ChartConstants.DEFAULT_BAR_HEIGHT - ChartConstants.ITEM_OFFSET,
          x2: xFather + barLengthFather / 20,
          y2: y + ChartConstants.DEFAULT_BAR_HEIGHT / 2,
        },
        style: api.style({
          fill: this._currentTheme.variables.fgText,
          stroke: this._currentTheme.variables.fgText,
        }),
      };

      const horizontalLine = {
        type: 'line',
        shape: {
          x1: xFather + barLengthFather / 20,
          y1: y + ChartConstants.DEFAULT_BAR_HEIGHT / 2,
          x2: x,
          y2: y + ChartConstants.DEFAULT_BAR_HEIGHT / 2,
        },
        style: api.style({
          fill: this._currentTheme.variables.fgText,
          stroke: this._currentTheme.variables.fgText,
        }),
      };

      links.push({
        type: 'group',
        children: [verticalLine, horizontalLine, arrow],
      });
    }

    return {
      type: 'group',
      children: links,
    };
  }

  renderZebra(params: any, api: any) {
    const index = api.value(0);
    const timeToday = api.coord([new Date(), index]);
    const timeStart = api.coord([api.value(1), index]);
    const timeEnd = api.coord([api.value(2), index]);

    //if time start > timeToday we need to fix the bar lenght and x position
    const barLength = timeEnd[0] - (timeStart[0] > timeToday[0] ? timeToday[0] : timeStart[0]);
    const x = timeStart[0] > timeToday[0] ? timeToday[0] : timeStart[0];
    const y = (index + 1) * ChartConstants.DEFAULT_BAR_HEIGHT;

    const rectNormal = this.clipRectByRect(params, {
      x: x,
      y: y,
      width: barLength,
      height: ChartConstants.DEFAULT_BAR_HEIGHT,
    });

    return {
      type: 'group',
      silent: true,
      children: [
        {
          type: 'rect',
          ignore: !rectNormal,
          shape: rectNormal,
          style: api.style({
            fill: this.zebraColor(index),
          }),
        },
      ],
    };
  }

  renderToday(params: any, api: any) {
    const today = api.coord([api.value(0), 0]);
    const x = today[0];
    const y_end = this._taskData.length * ChartConstants.DEFAULT_BAR_HEIGHT + ChartConstants.ZOOM_BOX_OFFSET;

    return {
      type: 'line',
      shape: {
        x1: x,
        y1: ChartConstants.ZOOM_BOX_OFFSET,
        x2: x,
        y2: y_end,
      },
      style: api.style({
        fill: this._currentTheme.variables.fgText,
        stroke: this._currentTheme.variables.fgText,
      }),
    };
  }

  clipRectByRect(params: any, rect: any) {
    return echarts.graphic.clipRectByRect(rect, {
      x: params.coordSys.x,
      y: params.coordSys.y,
      width: params.coordSys.width,
      height: params.coordSys.height,
    });
  }

  private zebraColor(index: number): string {
    return (index % 2 == 0 ? this._currentTheme.variables.bg2 : this._currentTheme.variables.bg3) as string;
  }

  private progressLineColor(isFinished: number, progressPercentage: number): string {
    if (isFinished) return this._currentTheme.variables.success as string;
    if (progressPercentage <= 45) return this._currentTheme.variables.primary as string;
    if (progressPercentage <= 90) return this._currentTheme.variables.warning as string;
    return this._currentTheme.variables.danger as string;
  }

  private createFinishedRect(params: any, api: any): any {
    const index = api.value(0);
    const timeStart = api.coord([api.value(2), index]);
    const actionEndDate = api.value(3);

    const finishedDate = api.value(13);
    const finishedEnd = api.coord([finishedDate, index]);
    const finishedBarLength = finishedEnd[0] - timeStart[0];
    const x = timeStart[0];
    const y = ChartConstants.DEFAULT_BAR_HEIGHT * (index + 1) + ChartConstants.ITEM_OFFSET;

    const rectFinished = this.clipRectByRect(params, {
      x: x,
      y: y,
      width: finishedBarLength,
      height: ChartConstants.ITEM_HEIGHT,
    });

    return {
      type: 'rect',
      ignore: !rectFinished,
      shape: rectFinished,
      style: api.style({
        fill: this.finishedRectColor(finishedDate, actionEndDate),
      }),
    };
  }

  private finishedRectColor(finishedDate: Date, actionEndDate: Date): string {
    return isAfter(finishedDate, actionEndDate)
      ? (this._currentTheme.variables.danger as string)
      : (this._currentTheme.variables.success as string);
  }
}
