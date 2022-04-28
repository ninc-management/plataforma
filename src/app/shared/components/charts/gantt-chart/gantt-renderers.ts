// This code was initially made by https://github.com/mfandre

import { isAfter } from 'date-fns';
import * as echarts from 'echarts/core';
import { DateManipulator } from './date-manipulator';
import { ChartTheme } from './gantt-chart.component';
import { TaskDataManipulator } from './task-data-manipulator';
import { TaskModel } from './task-data.model';

export class GanttRenderers {
  private HEIGHT_RATIO: number;
  private _taskData: TaskModel[];
  private _mappedData: any[];
  private taskDataManipulator: TaskDataManipulator;
  private _currentTheme: ChartTheme;
  private lastZebraY: number = 0;

  constructor(taskData: TaskModel[], mappedData: any[], heightRatio: number, currentTheme: ChartTheme) {
    this._taskData = taskData;
    this._mappedData = mappedData;
    this._currentTheme = currentTheme;
    this.taskDataManipulator = new TaskDataManipulator(this._currentTheme.palette);
    this.HEIGHT_RATIO = heightRatio;
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
    // Get the heigth corresponds to length 1 on y axis.
    const barHeight = api.size([0, 1])[1] * this.HEIGHT_RATIO;
    const x = timeStart[0];
    const y = timeStart[1] - barHeight - barHeight / 3;

    const taskNameWidth = echarts.format.getTextRect(taskName).width;
    const text = barLength > taskNameWidth + 40 && x + barLength >= 180 ? taskName : '';
    const rectNormal = this.clipRectByRect(params, {
      x: x,
      y: y,
      width: barLength,
      height: barHeight,
    });
    const rectText = this.clipRectByRect(params, {
      x: x,
      y: y,
      width: barLength,
      height: barHeight,
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
    //console.log("renderAxisLabelItem", api.value(0), api.value(1), api);
    //console.log("api.coord([0, api.value(0)])", api.coord([0, api.value(0)]))
    const index = api.value(0);
    const taskName = api.value(1);
    const end = api.value(3);
    const image = api.value(7);
    const groupName = api.value(8);
    const isToDrawGroup = api.value(9);
    const groupColor = api.value(10);
    const isFinished = api.value(11);

    //console.log(taskId, groupName, isToDrawGroup, groupColor)
    const y = api.coord([0, index])[1];
    const barHeight = api.size([0, 1])[1];

    const groupedElement = {
      type: 'group',
      silent: true,
      position: [10, y],
      children: [
        {
          type: 'rect',
          shape: { x: 0, y: params.coordSys.y - 2 * barHeight + barHeight / 6, width: 210, height: 46 },
          style: {
            fill: groupColor,
            //stroke: 'rgb(247, 127, 0)',
            //lineWidth: 2,
            //shadowBlur: 8,
            //shadowOffsetX: 3,
            //shadowOffsetY: 3,
            //shadowColor: 'rgba(0,0,0,0.3)'
          },
        },
        {
          // Position the image at the bottom center of its container.
          type: 'image',
          //left: 'center', // Position at the center horizontally.
          //bottom: '10%',  // Position beyond the bottom boundary 10%.
          style: {
            image: image,
            x: 5,
            y: params.coordSys.y - 2 * barHeight + barHeight / 3,
            width: 25,
            height: 25,
          },
        },
        {
          type: 'text',
          style: {
            x: 35,
            y: params.coordSys.y - 2 * barHeight + barHeight * 0.5,
            text: taskName,
            textVerticalAlign: 'bottom',
            textAlign: 'left',
            textFill: '#000',
            fontFamily: this._currentTheme.variables.fontMain,
            fontWeight: 600,
          },
        },
        {
          type: 'text',
          style: {
            x: 35,
            y: params.coordSys.y - 2 * barHeight + barHeight * 0.7,
            textVerticalAlign: 'bottom',
            textAlign: 'left',
            text: isFinished ? 'Finalizado' : DateManipulator.daysLeft(end),
            textFill: '#000',
            fontSize: 9,
            fontFamily: this._currentTheme.variables.fontMain,
            fontWeight: 600,
          },
        },
      ],
    };

    if (isToDrawGroup == 1) {
      // group agrupator (Vertical rectangle)
      groupedElement.children.push({
        type: 'rect',
        shape: { x: 105, y: params.coordSys.y - 2 * barHeight - barHeight / 3, width: 10, height: 46 },
        style: {
          fill: groupColor,
        },
      });
    } else {
      groupedElement.children.push({
        type: 'text',
        style: {
          x: -10,
          y: params.coordSys.y - 2 * barHeight + barHeight / 9,
          text: groupName,
          textVerticalAlign: 'bottom',
          textAlign: 'left',
          textFill: this._currentTheme.variables.fgText as string,
          fontFamily: this._currentTheme.variables.fontMain,
          fontWeight: 600,
        },
      });
    }

    return groupedElement;
  }

  renderArrowsItem(params: any, api: any) {
    const index = api.value(0);
    const timeStart = api.coord([api.value(2), index]);

    // Get the heigth corresponds to length 1 on y axis.
    const barHeight = api.size([0, 1])[1] * this.HEIGHT_RATIO;
    const x = timeStart[0];
    const y = timeStart[1] - barHeight - barHeight / 3;

    //the api.value only suports numeric and string values to get... to get taskDependencies I need to get from my real data constiable
    const currentData = this._taskData[params.dataIndex];
    const taskDependencies = currentData.taskDependencies;

    const links = [];
    const dependencies = taskDependencies;
    for (let j = 0; j < dependencies.length; j++) {
      const taskFather = this.taskDataManipulator.getTaskByIdInMappedData(this._mappedData, dependencies[j]);
      if (taskFather == null) continue;
      //console.log("dependencies", taskName, taskFather)
      const indexFather = taskFather[0]; //index
      const timeStartFather = api.coord([taskFather[2], indexFather]);
      const timeEndFather = api.coord([taskFather[3], indexFather]);

      const barLengthFather = timeEndFather[0] - timeStartFather[0];
      // Get the heigth corresponds to length 1 on y axis.
      const barHeightFather = api.size([0, 1])[1] * this.HEIGHT_RATIO;
      const xFather = timeStartFather[0];
      const yFather = timeStartFather[1] - barHeightFather - barHeightFather / 3;

      let arrow = {};
      const ARROW_SIZE = 5;
      //condition to draw the arrow correctly when a dependent task is exactly below another task
      if (x < ARROW_SIZE + xFather + barLengthFather / 20) {
        arrow = {
          type: 'polygon',
          shape: {
            points: [
              [xFather + barLengthFather / 20 - 5, y - 10],
              [xFather + barLengthFather / 20 + 5, y - 10],
              [xFather + barLengthFather / 20, y],
            ],
          },
          style: api.style({
            fill: this._currentTheme.variables.fgText,
            //stroke: "#000"
          }),
        };
      } else {
        //draw normaly
        arrow = {
          type: 'polygon',
          shape: {
            points: [
              [x - 10, y + barHeight / 2 - 5],
              [x - 10, y + barHeight / 2 + 5],
              [x, y + barHeight / 2],
            ],
          },
          style: api.style({
            fill: this._currentTheme.variables.fgText,
            //stroke: "#000"
          }),
        };
      }

      const verticalLine = {
        type: 'line',
        shape: {
          x1: xFather + barLengthFather / 20,
          y1: yFather + barHeightFather,
          x2: xFather + barLengthFather / 20,
          y2: y + barHeightFather / 2,
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
          y1: y + barHeightFather / 2,
          x2: x,
          y2: y + barHeightFather / 2,
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
    // Get the heigth corresponds to length 1 on y axis.
    const barHeight = api.size([0, 1])[1];
    const x = timeStart[0] > timeToday[0] ? timeToday[0] : timeStart[0];
    const y = timeStart[1] - barHeight;

    //if it is the last zebra
    if (index == 0) this.lastZebraY = y;

    const rectNormal = this.clipRectByRect(params, {
      x: x,
      y: y,
      width: barLength,
      height: barHeight,
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
    const barHeight = api.size([0, 1])[1];
    const x = today[0];
    const LINE_START_OFFSET = 70;
    const y_end = this.lastZebraY + barHeight;

    return {
      type: 'line',
      shape: {
        x1: x,
        y1: LINE_START_OFFSET,
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
    const barHeight = api.size([0, 1])[1] * this.HEIGHT_RATIO;
    const x = timeStart[0];
    const actionEndDate = api.value(3);

    const finishedDate = api.value(13);
    const finishedEnd = api.coord([finishedDate, index]);
    const finishedBarLength = finishedEnd[0] - timeStart[0];
    const finishedY = finishedEnd[1] - barHeight - barHeight / 3;

    const rectFinished = this.clipRectByRect(params, {
      x: x,
      y: finishedY,
      width: finishedBarLength,
      height: barHeight,
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
